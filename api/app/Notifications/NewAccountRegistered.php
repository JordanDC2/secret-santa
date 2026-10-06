<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Tries;

/**
 * Tells the person running the app that someone signed up (sent to ADMIN_EMAIL), so they
 * notice anyone outside the family, or a bot, finding the site.
 */
#[Tries(4)]
#[Backoff(10, 60, 300)]
class NewAccountRegistered extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly User $user) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): ElfMailMessage
    {
        $name = ElfMailMessage::plain($this->user->full_name);

        return (new ElfMailMessage)
            ->subject("🎅 New elf on the list: {$this->user->full_name}")
            ->greeting('Ho ho ho!')
            ->line('Someone new just signed up for Secret Santa:')
            ->line("**{$name}** (".ElfMailMessage::plain($this->user->email).')')
            ->line('Signed up '.$this->user->created_at?->timezone(config('app.admin_timezone'))->format('l, F j \a\t g:i A T').'.')
            ->line("If you don't recognize them, they may have found the site by chance.");
    }
}
