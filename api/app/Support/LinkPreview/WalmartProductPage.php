<?php

namespace App\Support\LinkPreview;

use DOMElement;
use DOMXPath;
use Throwable;

/**
 * Walmart's Open Graph tags have no price and add " - Walmart.com" to the name, but the page
 * embeds its product data as JSON for its own app (Next.js's __NEXT_DATA__), so read that.
 */
class WalmartProductPage
{
    public static function matches(string $url): bool
    {
        return (bool) preg_match('/(^|\.)walmart\.com$/', strtolower((string) parse_url($url, PHP_URL_HOST)));
    }

    /**
     * @return array{name?: string, price?: float, image?: string}
     */
    public static function read(DOMXPath $xpath): array
    {
        $scripts = $xpath->query("//script[@id='__NEXT_DATA__']");
        $script = $scripts ? $scripts->item(0) : null;

        if (! $script instanceof DOMElement) {
            return [];
        }

        try {
            $data = json_decode($script->textContent, true, 512, JSON_THROW_ON_ERROR);
        } catch (Throwable) {
            return [];
        }

        $product = data_get($data, 'props.pageProps.initialData.data.product');
        $name = data_get($product, 'name');
        $price = data_get($product, 'priceInfo.currentPrice.price');
        $image = data_get($product, 'imageInfo.thumbnailUrl');

        return array_filter([
            'name' => is_string($name) ? $name : null,
            'price' => data_get($product, 'priceInfo.currentPrice.currencyUnit') === 'USD' && is_numeric($price) ? (float) $price : null,
            'image' => is_string($image) ? $image : null,
        ], fn ($value) => $value !== null);
    }
}
