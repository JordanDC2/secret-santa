<?php

namespace App\Notifications;

use App\Enums\EmailKind;
use App\Models\Group;
use App\Models\User;
use App\Notifications\Concerns\RespectsEmailPreferences;
use App\Notifications\Contracts\OptionalEmail;
use App\Support\PersonNames;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Tries;

/** Tells a group's owner that someone joined with the invite code. */
#[Tries(4)]
#[Backoff(10, 60, 300)]
class MemberJoinedGroup extends Notification implements OptionalEmail, ShouldQueue
{
    use Queueable, RespectsEmailPreferences;

    /**
     * @param  int  $membersCount  Captured at join time, since the queued email reloads the group when it sends.
     */
    public function __construct(
        public readonly Group $group,
        public readonly User $member,
        public readonly int $membersCount,
    ) {}

    public function emailKind(): EmailKind
    {
        return EmailKind::NewMembers;
    }

    public function toMail(User $notifiable): ElfMailMessage
    {
        // As the group card names them.
        $name = PersonNames::inGroup($this->member, $this->group);
        $memberName = ElfMailMessage::plain($name);
        $groupName = ElfMailMessage::plain($this->group->name);

        return (new ElfMailMessage)
            ->subject("🎄 {$name} joined {$this->group->name}")
            ->greeting('Hi '.ElfMailMessage::plain($notifiable->first_name).'!')
            ->line("**{$memberName}** just joined **{$groupName}** with your invite code.")
            ->line("That makes {$this->membersCount} members on the list so far.")
            ->action('View Your Groups', config('app.frontend_url').'/')
            ->settingsFooter(EmailKind::NewMembers);
    }
}
