<?php

namespace App\Support\Google;

use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Checks the token Google's "Continue with Google" button hands the React app: signed by Google,
 * made for this site (our client id), unexpired, and for a confirmed email address.
 */
class GoogleIdTokenVerifier
{
    /** Google's public signing keys. They rotate every few weeks, so they're fetched, not stored. */
    private const KEYS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

    private const ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];

    /**
     * The profile in the token, or null if it isn't a valid sign-in for this site.
     */
    public function verify(string $idToken): ?GoogleProfile
    {
        $clientId = config('services.google.client_id');

        if (! is_string($clientId) || $clientId === '') {
            return null;
        }

        try {
            // Checks the signature and the expiry time (allowing for a slightly-off server clock).
            JWT::$leeway = 60;
            $claims = (array) JWT::decode($idToken, JWK::parseKeySet($this->keys()));
        } catch (Throwable) {
            return null;
        }

        $valid = in_array($claims['iss'] ?? null, self::ISSUERS, true)
            && ($claims['aud'] ?? null) === $clientId
            && ($claims['email_verified'] ?? false) === true
            && is_string($claims['sub'] ?? null)
            && is_string($claims['email'] ?? null);

        if (! $valid) {
            return null;
        }

        $email = strtolower($claims['email']);
        $firstName = trim((string) ($claims['given_name'] ?? ''));
        $lastName = trim((string) ($claims['family_name'] ?? ''));

        return new GoogleProfile(
            googleId: $claims['sub'],
            email: $email,
            // No name on the Google account at all: start from the email, editable in Settings.
            firstName: $firstName !== '' ? $firstName : ucfirst(strstr($email, '@', true) ?: $email),
            lastName: $lastName !== '' ? $lastName : null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function keys(): array
    {
        return Cache::remember('google-signin-keys', now()->addHour(), fn () => Http::timeout(5)->get(self::KEYS_URL)->throw()->json());
    }
}
