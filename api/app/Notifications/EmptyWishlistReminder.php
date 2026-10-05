<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Tries;

/** Three weeks before an exchange: your wishlist is empty, so your Santa has nothing to go on. */
#[Tries(4)]
#[Backoff(10, 60, 300)]
class EmptyWishlistReminder extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $groupName,
        public readonly string $exchangeDate,
        public readonly int $daysLeft,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(User $notifiable): ElfMailMessage
    {
        $group = ElfMailMessage::plain($this->groupName);

        return (new ElfMailMessage)
            ->subject("📝 Your Secret Santa needs some ideas for {$this->groupName}")
            ->greeting('Hi '.ElfMailMessage::plain($notifiable->name).'!')
            ->line("The **{$group}** gift exchange is {$this->daysLeft} days away, on {$this->exchangeDate}, and your wishlist is still empty.")
            ->line('Add a few things you\'d love, so your Secret Santa has something to go on. Sizes, favourite colours and links all help!')
            ->action('Add to Your Wishlist', config('app.frontend_url').'/wishlist');
    }
}
