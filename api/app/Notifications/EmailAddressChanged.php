<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Tries;

/**
 * A heads-up to someone's OLD address when they change their email in Settings, so a change
 * they didn't make doesn't go unnoticed. Never says what the new address is.
 */
#[Tries(4)]
#[Backoff(10, 60, 300)]
class EmailAddressChanged extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly string $firstName) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(AnonymousNotifiable $notifiable): ElfMailMessage
    {
        return (new ElfMailMessage)
            ->subject('Your Secret Santa email was changed')
            ->greeting('Hi '.ElfMailMessage::plain($this->firstName).'!')
            ->line("Just letting you know: the email on your Secret Santa account was changed, so I won't write to this address any more.")
            ->line('If that was you, all is well. If it wasn\'t, reply to this email and the site\'s owner will help you get your account back.');
    }
}
