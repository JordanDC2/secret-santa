<?php

namespace App\Support\LinkPreview;

use DOMElement;
use DOMXPath;
use Throwable;

/**
 * Amazon product pages publish no Open Graph or schema.org data, so this reads the page's
 * own markup instead: the product title, the main photo and the "price to pay".
 */
class AmazonProductPage
{
    public static function matches(string $url): bool
    {
        return (bool) preg_match('/(^|\.)amazon\.[a-z.]+$/', strtolower(parse_url($url, PHP_URL_HOST) ?? ''));
    }

    /**
     * @return array{name?: string, price?: string, image?: string}
     */
    public static function read(DOMXPath $xpath, string $url): array
    {
        $image = $xpath->query("//img[@id='landingImage']")?->item(0);

        return array_filter([
            'name' => self::text($xpath, "//*[@id='productTitle']"),
            // Other Amazon stores price in other currencies; we only keep dollars.
            'price' => str_ends_with(strtolower(parse_url($url, PHP_URL_HOST) ?? ''), 'amazon.com')
                ? self::text($xpath, "//*[contains(concat(' ', normalize-space(@class), ' '), ' priceToPay ')]//span[@aria-hidden='true']")
                : null,
            'image' => $image ? self::largestImage($image) : null,
        ], fn ($value) => $value !== null);
    }

    private static function text(DOMXPath $xpath, string $query): ?string
    {
        foreach ($xpath->query($query) ?: [] as $node) {
            $text = trim(preg_replace('/\s+/u', ' ', $node->textContent));

            if ($text !== '') {
                return $text;
            }
        }

        return null;
    }

    /**
     * The full-size photo, else the first size listed in the image's JSON, else whatever it shows.
     */
    private static function largestImage(DOMElement $image): ?string
    {
        if ($image->getAttribute('data-old-hires')) {
            return $image->getAttribute('data-old-hires');
        }

        try {
            $sizes = json_decode($image->getAttribute('data-a-dynamic-image'), true, 4, JSON_THROW_ON_ERROR);

            if (is_array($sizes) && $sizes !== []) {
                return (string) array_key_first($sizes);
            }
        } catch (Throwable) {
            // Fall through to the plain src.
        }

        return $image->getAttribute('src') ?: null;
    }
}
