<?php

namespace App\Support\LinkPreview;

/**
 * Looks up the IP addresses for a hostname. Its own class so tests can swap in fixed answers
 * instead of hitting real DNS.
 */
class HostResolver
{
    /**
     * @return array<int, string>
     */
    public function resolve(string $host): array
    {
        if (filter_var($host, FILTER_VALIDATE_IP)) {
            return [$host];
        }

        $records = @dns_get_record($host, DNS_A | DNS_AAAA) ?: [];

        return array_values(array_filter(array_map(
            fn (array $record) => $record['ip'] ?? $record['ipv6'] ?? null,
            $records,
        )));
    }
}
