<?php

namespace App\Notifications\Contracts;

use App\Enums\EmailKind;

/**
 * An email people can switch off on their Settings page (see RespectsEmailPreferences).
 */
interface OptionalEmail
{
    public function emailKind(): EmailKind;
}
