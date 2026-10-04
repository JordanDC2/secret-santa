<?php

namespace App\Listeners;

use App\Models\User;
use App\Notifications\NewAccountRegistered;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Notification;

class NotifyAdminOfNewAccount
{
    public function handle(Registered $event): void
    {
        $adminEmail = config('app.admin_email');

        if (! $adminEmail || ! $event->user instanceof User) {
            return;
        }

        Notification::route('mail', $adminEmail)->notify(new NewAccountRegistered($event->user));
    }
}
