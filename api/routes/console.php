<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Exchange reminders go out each morning in the organizer's timezone. The server's cron runs
// `schedule:run` every minute (see deploy/secret-santa-scheduler).
Schedule::command('app:send-exchange-reminders')
    ->dailyAt('09:00')
    ->timezone(config('app.reminder_timezone'));

// The admin page's map reads a DB-IP location file; DB-IP publishes a new one each month.
Schedule::command('geo:update')->monthlyOn(3, '04:00');
