<?php

namespace App\Notifications;

use App\Enums\EmailKind;
use App\Models\Group;
use App\Models\User;
use App\Notifications\Concerns\RespectsEmailPreferences;
use App\Notifications\Contracts\OptionalEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Tries;

/**
 * Tells a Santa that the person they drew left the group, so they now buy for whoever that
 * person was buying for (see LeaveGroup). Only the Santa is told: their new person's own
 * Santa changing stays a secret, like any Santa.
 */
#[Tries(4)]
#[Backoff(10, 60, 300)]
class SecretSantaPersonChanged extends Notification implements OptionalEmail, ShouldQueue
{
    use Queueable, RespectsEmailPreferences;

    /**
     * @param  string  $leaverName  As the group named them, captured before they left.
     */
    public function __construct(
        public readonly Group $group,
        public readonly User $recipient,
        public readonly string $leaverName,
    ) {}

    public function emailKind(): EmailKind
    {
        return EmailKind::Assignments;
    }

    public function toMail(User $notifiable): ElfMailMessage
    {
        $who = new Addressee($notifiable);
        $leaver = ElfMailMessage::plain($this->leaverName);
        $groupName = ElfMailMessage::plain($this->group->name);
        $hasNew = $who->isManaged() ? "{$who->name()} has" : 'you have';

        return (new ElfMailMessage)
            ->subject($who->isManaged()
                ? "🎁 {$notifiable->first_name}'s Secret Santa person changed in {$this->group->name}"
                : "🎁 Your Secret Santa person changed in {$this->group->name}")
            ->greeting($who->greeting())
            ->line("{$leaver} left **{$groupName}**, so {$hasNew} a new person to shop for.")
            ->line(ElfMailMessage::recipientBox($who, $this->recipient))
            ->line("If you'd already claimed something on {$leaver}'s list, it's still marked as yours. Undo the claim there if you won't be giving it now.")
            ->action('View their wishlist', config('app.frontend_url')."/wishlists/{$this->recipient->id}")
            ->settingsFooter(EmailKind::Assignments, $who);
    }
}
