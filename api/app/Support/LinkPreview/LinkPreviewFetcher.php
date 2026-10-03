<?php

namespace App\Support\LinkPreview;

use DOMDocument;
use DOMElement;
use DOMXPath;
use GuzzleHttp\Exception\TransferException;
use GuzzleHttp\Handler\CurlHandler;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Reads a product page and pulls out its name, price and image from the metadata shops
 * publish for link previews (Open Graph tags and schema.org Product data).
 */
class LinkPreviewFetcher
{
    private const MAX_REDIRECTS = 3;

    // Amazon product pages alone run about 3 MB.
    private const MAX_BYTES = 5_000_000;

    public function __construct(private readonly HostResolver $resolver) {}

    /**
     * @return array{name: ?string, price: ?float, image_url: ?string}
     */
    public function fetch(string $url): array
    {
        $page = $this->download($url);

        return $page === null
            ? ['name' => null, 'price' => null, 'image_url' => null]
            : $this->parse($page['html'], $page['url']);
    }

    /**
     * Follows redirects by hand so every hop gets the same safety check.
     *
     * @return array{html: string, url: string}|null The page and the address it finally came from.
     */
    private function download(string $url): ?array
    {
        for ($hop = 0; $hop <= self::MAX_REDIRECTS; $hop++) {
            $safe = SafeUrl::check($url, $this->resolver);

            if (! $safe) {
                return null;
            }

            try {
                // Force curl: Guzzle hands streamed requests to PHP streams, which ignore curl options.
                $response = Http::setHandler(new CurlHandler)
                    ->withOptions([
                        'allow_redirects' => false,
                        'curl' => [
                            // Connect only to the address we just checked (no DNS rebinding).
                            CURLOPT_RESOLVE => ["{$safe->host}:{$safe->port}:{$safe->ip}"],
                            // Give up on oversized pages instead of downloading all of them.
                            CURLOPT_NOPROGRESS => false,
                            CURLOPT_XFERINFOFUNCTION => fn ($curl, int $total, int $received) => $received > self::MAX_BYTES ? 1 : 0,
                        ],
                    ])
                    ->connectTimeout(4)
                    ->timeout(8)
                    ->withHeaders([
                        'User-Agent' => 'Mozilla/5.0 (compatible; SecretSantaLinkPreview/1.0)',
                        'Accept' => 'text/html,application/xhtml+xml',
                        'Accept-Language' => 'en-US,en;q=0.8',
                    ])
                    ->get($safe->url);
            } catch (ConnectionException|TransferException) {
                return null;
            }

            if ($response->redirect() && $response->header('Location')) {
                $url = $this->absoluteUrl($response->header('Location'), $safe->url);

                continue;
            }

            if (! $response->successful() || ! str_contains(strtolower($response->header('Content-Type')), 'html')) {
                return null;
            }

            return ['html' => substr($response->body(), 0, self::MAX_BYTES), 'url' => $safe->url];
        }

        return null;
    }

    /**
     * @return array{name: ?string, price: ?float, image_url: ?string}
     */
    public function parse(string $html, string $pageUrl): array
    {
        $document = new DOMDocument;
        // Real-world HTML is rarely valid; ignore warnings and read what we can.
        @$document->loadHTML('<?xml encoding="UTF-8">'.$html, LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING);
        $xpath = new DOMXPath($document);

        $product = $this->jsonLdProduct($xpath);
        $amazon = AmazonProductPage::matches($pageUrl) ? AmazonProductPage::read($xpath, $pageUrl) : [];
        $meta = fn (string ...$names) => $this->meta($xpath, ...$names);

        // Only deliberate product metadata: a plain <title> is often a bot-check or
        // "please wait" page ("Hang Tight! Routing to checkout..") rather than the product.
        $name = $product['name'] ?? $amazon['name'] ?? $meta('og:title', 'twitter:title');
        $price = $product['price']
            ?? $this->toPrice($amazon['price'] ?? null)
            ?? $this->toPrice($meta('product:price:amount', 'og:price:amount'));
        $image = $product['image'] ?? $amazon['image'] ?? $meta('og:image:secure_url', 'og:image', 'twitter:image', 'twitter:image:src');

        $imageUrl = $image ? $this->absoluteUrl($image, $pageUrl) : null;

        return [
            'name' => $name ? mb_substr(trim(html_entity_decode($name, ENT_QUOTES | ENT_HTML5)), 0, 255) : null,
            'price' => $price,
            'image_url' => $imageUrl && preg_match('#^https?://#i', $imageUrl) && strlen($imageUrl) <= 2048 ? $imageUrl : null,
        ];
    }

    /**
     * The first of these meta tags that has a value.
     */
    private function meta(DOMXPath $xpath, string ...$names): ?string
    {
        foreach ($names as $name) {
            $nodes = $xpath->query("//meta[@property='{$name}' or @name='{$name}']/@content");

            if ($nodes && $nodes->length && trim($nodes->item(0)->nodeValue) !== '') {
                return trim($nodes->item(0)->nodeValue);
            }
        }

        return null;
    }

    /**
     * schema.org Product data, the most precise source when a shop provides it.
     *
     * @return array{name?: string, price?: float, image?: string}
     */
    private function jsonLdProduct(DOMXPath $xpath): array
    {
        foreach ($xpath->query("//script[@type='application/ld+json']") ?: [] as $script) {
            if (! $script instanceof DOMElement) {
                continue;
            }

            try {
                $data = json_decode($script->textContent, true, 32, JSON_THROW_ON_ERROR);
            } catch (Throwable) {
                continue;
            }

            foreach ($this->flattenJsonLd($data) as $node) {
                $types = (array) ($node['@type'] ?? []);

                if (! in_array('Product', $types, true)) {
                    continue;
                }

                $offers = $node['offers'] ?? [];
                $offer = array_is_list((array) $offers) ? ($offers[0] ?? []) : $offers;
                $currency = $offer['priceCurrency'] ?? 'USD';
                $price = $currency === 'USD' ? $this->toPrice($offer['price'] ?? $offer['lowPrice'] ?? null) : null;
                $image = $node['image'] ?? null;
                $image = is_array($image) ? ($image['url'] ?? $image[0] ?? null) : $image;
                $image = is_array($image) ? ($image['url'] ?? null) : $image;

                return array_filter([
                    'name' => is_string($node['name'] ?? null) ? $node['name'] : null,
                    'price' => $price,
                    'image' => is_string($image) ? $image : null,
                ], fn ($value) => $value !== null);
            }
        }

        return [];
    }

    /**
     * JSON-LD can be one object, a list, or a {"@graph": [...]} wrapper.
     *
     * @return array<int, array<string, mixed>>
     */
    private function flattenJsonLd(mixed $data): array
    {
        if (! is_array($data) || $data === []) {
            return [];
        }

        if (isset($data['@graph']) && is_array($data['@graph'])) {
            return $this->flattenJsonLd($data['@graph']);
        }

        return array_is_list($data)
            ? array_merge(...array_map(fn ($item) => $this->flattenJsonLd($item), $data))
            : [$data];
    }

    private function toPrice(mixed $value): ?float
    {
        if (is_string($value)) {
            $value = preg_replace('/[^\d.]/', '', str_replace(',', '', $value));
        }

        return is_numeric($value) && (float) $value > 0 && (float) $value < 100_000_000 ? round((float) $value, 2) : null;
    }

    private function absoluteUrl(string $url, string $base): string
    {
        if (preg_match('#^https?://#i', $url)) {
            return $url;
        }

        $parts = parse_url($base);

        if (! isset($parts['scheme'], $parts['host'])) {
            return $url;
        }

        $origin = "{$parts['scheme']}://{$parts['host']}".(isset($parts['port']) ? ":{$parts['port']}" : '');

        if (str_starts_with($url, '//')) {
            return "{$parts['scheme']}:{$url}";
        }

        if (str_starts_with($url, '/')) {
            return $origin.$url;
        }

        $directory = rtrim(dirname($parts['path'] ?? '/'), '/');

        return "{$origin}{$directory}/{$url}";
    }
}
