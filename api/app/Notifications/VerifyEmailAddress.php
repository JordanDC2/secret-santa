<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Support\Facades\URL;

/**
 * "Confirm your email": one click on the link and it's done, signed in or not (the signed link
 * itself proves they can read this inbox). See VerifyEmailHandler.
 */
#[Tries(4)]
#[Backoff(10, 60, 300)]
class VerifyEmailAddress extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(User $notifiable): ElfMailMessage
    {
        $hours = intdiv((int) config('auth.verification.expire', 1440), 60);

        return (new ElfMailMessage)
            ->subject('✉️ Confirm your email for Secret Santa')
            ->greeting('Hi '.ElfMailMessage::plain($notifiable->first_name).'!')
            ->line("Please confirm this is your email, so your Secret Santa assignment and messages land in the right inbox and not in someone else's stocking.")
            ->action('Confirm my email', self::url($notifiable))
            ->line("The link works for {$hours} hours. If it runs out, there's a button in the app to send a new one.")
            ->line("If you didn't sign up for Secret Santa, you can ignore this email.");
    }

    /**
     * A link to the API that only works for this person, at this address, until it expires.
     */
    public static function url(User $user): string
    {
        return URL::temporarySignedRoute(
            'auth.email.verify',
            now()->addMinutes((int) config('auth.verification.expire', 1440)),
            ['user' => $user->id, 'hash' => sha1($user->getEmailForVerification())],
        );
    }
}
