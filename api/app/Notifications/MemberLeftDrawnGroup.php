<?php

namespace App\Notifications;

use App\Models\Group;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Tries;

/**
 * Tells a group's owner that someone left after the draw and the draw couldn't be patched
 * (their Santa and their person would have matched themselves, or an exclusion blocked it),
 * so someone has no person or no Santa until the owner draws again. Always sent: without it
 * the group stays broken.
 */
#[Tries(4)]
#[Backoff(10, 60, 300)]
class MemberLeftDrawnGroup extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  string  $leaverName  As the group named them, captured before they left.
     */
    public function __construct(
        public readonly Group $group,
        public readonly string $leaverName,
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
        $leaver = ElfMailMessage::plain($this->leaverName);
        $groupName = ElfMailMessage::plain($this->group->name);

        return (new ElfMailMessage)
            ->subject("❄️ {$this->leaverName} left {$this->group->name}: time for a new draw")
            ->greeting('Hi '.ElfMailMessage::plain($notifiable->first_name).'!')
            ->line("**{$leaver}** left **{$groupName}** after names were drawn. I couldn't simply hand their person to their Santa this time, so someone is left without a match.")
            ->line('Start a new draw from the ⋯ menu on the group card so everyone has someone to shop for.')
            ->action('View your groups', config('app.frontend_url').'/');
    }
}
