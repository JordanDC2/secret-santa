<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Tries;

#[Tries(4)]
#[Backoff(10, 60, 300)]
class ResetPasswordLink extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly string $token) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): ElfMailMessage
    {
        $url = config('app.frontend_url').'/reset-password?'.http_build_query([
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ]);
        $expiresInMinutes = config('auth.passwords.'.config('auth.defaults.passwords').'.expire');

        return (new ElfMailMessage)
            ->subject('🔑 Reset your Secret Santa password')
            ->greeting("Hi {$notifiable->name}!")
            ->line('I heard you forgot your password. No coal for you, it happens to the best of us.')
            ->action('Reset Password', $url)
            ->line("This link melts like a snowflake in {$expiresInMinutes} minutes.")
            ->line("If you didn't ask for this, you can ignore this email and your password won't change.");
    }
}
