<?php

namespace App\Support\Google;

/**
 * Who a checked Google sign-in belongs to.
 */
final readonly class GoogleProfile
{
    public function __construct(
        /** Google's id for the account, which never changes. */
        public string $googleId,
        /** Lowercased. Only ever an address Google has confirmed belongs to them. */
        public string $email,
        public string $firstName,
        /** Google accounts may have just one name. */
        public ?string $lastName,
    ) {}
}
