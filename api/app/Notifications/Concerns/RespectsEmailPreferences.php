<?php

namespace App\Notifications\Concerns;

use App\Enums\EmailKind;
use App\Models\User;

/**
 * For notifications people can switch off: sends by email unless the recipient turned this
 * kind off on their Account page.
 */
trait RespectsEmailPreferences
{
    abstract protected function emailKind(): EmailKind;

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return $notifiable instanceof User && ! $notifiable->wantsEmail($this->emailKind()) ? [] : ['mail'];
    }
}
