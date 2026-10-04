<?php

namespace App\Notifications;

use App\Models\Group;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Tries;

/** Tells a group's owner that someone joined with the invite code. */
#[Tries(4)]
#[Backoff(10, 60, 300)]
class MemberJoinedGroup extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  int  $membersCount  Captured at join time, since the queued email reloads the group when it sends.
     */
    public function __construct(
        public readonly Group $group,
        public readonly User $member,
        public readonly int $membersCount,
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
        $memberName = ElfMailMessage::plain($this->member->name);
        $groupName = ElfMailMessage::plain($this->group->name);

        return (new ElfMailMessage)
            ->subject("🎄 {$this->member->name} joined {$this->group->name}")
            ->greeting('Hi '.ElfMailMessage::plain($notifiable->name).'!')
            ->line("**{$memberName}** just joined **{$groupName}** with your invite code.")
            ->line("That makes {$this->membersCount} members on the list so far.")
            ->action('View Your Groups', config('app.frontend_url').'/');
    }
}
