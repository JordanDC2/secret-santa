<?php

namespace App\Support\LinkPreview;

/**
 * A URL that's safe for the server to fetch: http(s) on the standard ports, and a host that
 * only resolves to public internet addresses. Without this, a pasted "link" could make the
 * server talk to itself (Reverb on 127.0.0.1, Caddy's admin API) or to Oracle's metadata
 * service at 169.254.169.254: a server-side request forgery (SSRF).
 */
final class SafeUrl
{
    private function __construct(
        public readonly string $url,
        public readonly string $host,
        public readonly int $port,
        /** The checked address to connect to, so DNS can't change between check and fetch. */
        public readonly string $ip,
    ) {}

    public static function check(string $url, HostResolver $resolver): ?self
    {
        $parts = parse_url($url);
        $scheme = strtolower($parts['scheme'] ?? '');
        $host = strtolower(trim($parts['host'] ?? '', '[]'));

        if (! in_array($scheme, ['http', 'https'], true) || $host === '' || isset($parts['user']) || isset($parts['pass'])) {
            return null;
        }

        $port = $parts['port'] ?? ($scheme === 'https' ? 443 : 80);

        if (! in_array($port, [80, 443], true)) {
            return null;
        }

        $ips = $resolver->resolve($host);

        // Every address must be public; one private answer is enough to refuse.
        if ($ips === [] || array_filter($ips, fn (string $ip) => ! self::isPublic($ip)) !== []) {
            return null;
        }

        return new self($url, $host, $port, $ips[0]);
    }

    public static function isPublic(string $ip): bool
    {
        if (! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            return false;
        }

        // Ranges PHP's flags don't cover: carrier-grade NAT, and IPv4-mapped IPv6 addresses.
        $packed = inet_pton($ip);

        if (strlen($packed) === 4) {
            $long = ip2long($ip);

            return ! ($long >= ip2long('100.64.0.0') && $long <= ip2long('100.127.255.255'));
        }

        return ! str_starts_with(bin2hex($packed), '00000000000000000000ffff');
    }
}
