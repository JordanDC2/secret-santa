<?php

namespace App\Notifications;

use App\Models\Group;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Tries;

#[Tries(4)]
#[Backoff(10, 60, 300)]
class SecretSantaAssigned extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Group $group,
        public readonly User $recipient
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): ElfMailMessage
    {
        $wishlistUrl = config('app.frontend_url')."/wishlists/{$this->recipient->id}";

        return (new ElfMailMessage)
            ->subject("🎁 Your Secret Santa assignment for {$this->group->name}")
            ->greeting("Hi {$notifiable->name}!")
            ->line('I have news straight from the North Pole!')
            ->line("The names have been drawn for **{$this->group->name}**.")
            ->line('You are the Secret Santa for:')
            ->line("## {$this->recipient->name}")
            ->line('Keep it a secret, and happy gifting! 🎄')
            ->action("View {$this->recipient->name}'s Wishlist", $wishlistUrl);
    }
}
