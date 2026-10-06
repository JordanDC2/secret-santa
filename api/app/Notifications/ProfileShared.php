<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Tries;

/** Someone shared looking after their kid or pet with you. Always sent: it changes your account. */
#[Tries(4)]
#[Backoff(10, 60, 300)]
class ProfileShared extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $sharerName,
        public readonly int $profileId,
        public readonly string $profileName,
        public readonly bool $isPet,
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
        $sharer = ElfMailMessage::plain($this->sharerName);
        $profile = ElfMailMessage::plain($this->profileName);

        return (new ElfMailMessage)
            ->subject("{$this->sharerName} shared {$this->profileName}'s Secret Santa list with you")
            ->greeting('Hi '.ElfMailMessage::plain($notifiable->first_name).'!')
            ->line("{$sharer} added you as someone who looks after **{$profile}**".($this->isPet ? ' 🐾' : '').'.')
            ->line("You can now keep {$profile}'s wishlist (and see what's been claimed on it), and handle {$profile}'s draws and Santa chats. You'll find {$profile} under Kids & pets on your Settings page.")
            // No names in the button label: Laravel repeats it in the footer as Markdown.
            ->action('Open their wishlist', config('app.frontend_url')."/wishlist?for={$this->profileId}");
    }
}
