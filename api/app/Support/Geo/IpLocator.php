<?php

namespace App\Support\Geo;

use MaxMind\Db\Reader;
use Throwable;

/**
 * Turns an internet address into a country and state or province, using the DB-IP file on
 * this server (see `php artisan geo:update`). Coarse on purpose: the town is never read.
 * Without the file (say, a fresh dev machine) every lookup is simply unknown.
 */
class IpLocator
{
    private ?Reader $reader = null;

    private bool $opened = false;

    /**
     * @return array{country: string, region: ?string}|null
     */
    public function locate(string $ip): ?array
    {
        // Home networks, localhost and the like have no location.
        if (! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            return null;
        }

        $reader = $this->reader();

        if ($reader === null) {
            return null;
        }

        try {
            $record = $reader->get($ip);
        } catch (Throwable) {
            return null;
        }

        $country = is_array($record) ? ($record['country']['iso_code'] ?? null) : null;

        if (! is_string($country) || strlen($country) !== 2) {
            return null;
        }

        $region = $record['subdivisions'][0]['names']['en'] ?? null;

        return ['country' => $country, 'region' => is_string($region) && $region !== '' ? $region : null];
    }

    /**
     * When the file was built, to credit the data's month on the map.
     */
    public function builtAt(): ?int
    {
        return $this->reader()?->metadata()->buildEpoch;
    }

    private function reader(): ?Reader
    {
        if (! $this->opened) {
            $this->opened = true;
            $path = (string) config('services.dbip.path');

            try {
                $this->reader = is_file($path) ? new Reader($path) : null;
            } catch (Throwable) {
                $this->reader = null;
            }
        }

        return $this->reader;
    }
}
