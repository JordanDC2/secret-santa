<?php

namespace App\Notifications\Concerns;

use App\Enums\EmailKind;
use App\Models\User;

/**
 * For notifications people can switch off: sends by email unless the recipient turned this
 * kind off on their Settings page. For a kid or pet, each of their parents' own settings
 * decide (see User::routeNotificationForMail()).
 */
trait RespectsEmailPreferences
{
    abstract public function emailKind(): EmailKind;

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return $notifiable instanceof User && ! $notifiable->wantsEmail($this->emailKind()) ? [] : ['mail'];
    }
}
