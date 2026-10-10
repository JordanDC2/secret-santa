<?php

namespace App\Notifications\Contracts;

use App\Enums\EmailKind;

/**
 * A notification people can switch off on their Settings page, by email and by push separately
 * (see RespectsNotificationPreferences).
 */
interface OptionalEmail
{
    public function emailKind(): EmailKind;
}
