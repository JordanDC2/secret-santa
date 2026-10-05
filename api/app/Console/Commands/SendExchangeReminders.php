<?php

namespace App\Console\Commands;

use App\Actions\Groups\SendExchangeReminders as SendReminders;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:send-exchange-reminders')]
#[Description('Email empty-wishlist and shopping reminders for upcoming gift exchanges (runs daily)')]
class SendExchangeReminders extends Command
{
    public function handle(SendReminders $sendReminders): int
    {
        $sent = $sendReminders(now(config('app.reminder_timezone'))->startOfDay());

        $this->info("Sent {$sent} reminder email(s).");

        return self::SUCCESS;
    }
}
