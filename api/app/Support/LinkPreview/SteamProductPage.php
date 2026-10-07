<?php

namespace App\Support\LinkPreview;

use DOMXPath;

/**
 * Steam's og:title wraps the name in sale copy ("Save 50% on Kena on Steam") and has no
 * price tag, but the store heading has the plain name and the page carries schema.org
 * microdata (itemprop="price") for the main purchase option.
 */
class SteamProductPage
{
    // Mature-rated games redirect to an age check unless these cookies say it was passed.
    public const AGE_CHECK_COOKIE = 'birthtime=0; lastagecheckage=1-January-1970; wants_mature_content=1';

    public static function matches(string $url): bool
    {
        return strtolower((string) parse_url($url, PHP_URL_HOST)) === 'store.steampowered.com';
    }

    /**
     * Steam sends links to games it won't show (delisted, not sold in our region, bad ids) to the
     * store front page, whose share picture is Steam's own art rather than the game's.
     */
    public static function isStorePage(string $url): bool
    {
        return (bool) preg_match('#^/(agecheck/)?(app|sub|bundle)/\d+#', (string) parse_url($url, PHP_URL_PATH));
    }

    /**
     * @return array{name?: string, price?: string}
     */
    public static function read(DOMXPath $xpath): array
    {
        $first = function (string $query) use ($xpath): ?string {
            $nodes = $xpath->query($query);
            $value = $nodes && $nodes->length ? trim((string) $nodes->item(0)->nodeValue) : '';

            return $value !== '' ? $value : null;
        };

        $currency = $first("//meta[@itemprop='priceCurrency']/@content");

        return array_filter([
            'name' => $first("//*[contains(concat(' ', normalize-space(@class), ' '), ' apphub_AppName ')]")
                ?? self::withoutSaleCopy($first("//meta[@property='og:title']/@content")),
            'price' => $currency === 'USD' ? $first("//meta[@itemprop='price']/@content") : null,
        ], fn ($value) => $value !== null);
    }

    /**
     * Bundle pages have no store heading, so fall back to og:title minus "Save 80% on" and "on Steam".
     */
    private static function withoutSaleCopy(?string $title): ?string
    {
        $name = $title === null ? '' : trim((string) preg_replace(['/^Save \d+% on /', '/ on Steam$/'], '', $title));

        return $name !== '' ? $name : null;
    }
}
