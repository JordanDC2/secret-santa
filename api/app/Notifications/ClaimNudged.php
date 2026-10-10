<?php

namespace App\Notifications;

use App\Enums\EmailKind;
use App\Models\User;
use App\Notifications\Concerns\RespectsNotificationPreferences;
use App\Notifications\Contracts\OptionalEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Tries;
use NotificationChannels\WebPush\WebPushMessage;

/** A fellow shopper asking whether you're still getting a gift you claimed. */
#[Tries(4)]
#[Backoff(10, 60, 300)]
class ClaimNudged extends Notification implements OptionalEmail, ShouldQueue
{
    use Queueable, RespectsNotificationPreferences;

    public function __construct(
        public readonly int $ownerId,
        public readonly string $ownerName,
        public readonly string $itemName,
        public readonly ?string $claimedAt,
        public readonly ?string $nudgerName,
    ) {}

    public function emailKind(): EmailKind
    {
        return EmailKind::Nudges;
    }

    public function toMail(User $notifiable): ElfMailMessage
    {
        $owner = ElfMailMessage::plain($this->ownerName);
        $who = $this->nudgerName === null ? "Someone shopping for {$owner}" : ElfMailMessage::plain($this->nudgerName);

        return (new ElfMailMessage)
            ->subject("🔔 Still getting {$this->itemName} for {$this->ownerName}?")
            ->greeting('Hi '.ElfMailMessage::plain($notifiable->first_name).'!')
            ->line("{$who} is wondering if you're still getting **".ElfMailMessage::plain($this->itemName)."** for {$owner}."
                .($this->claimedAt ? " You claimed it in {$this->claimedAt}." : ''))
            ->line("If you've bought it, mark it **bought** so everyone knows. If you've changed your mind, undo your claim so someone else can get it.")
            ->line("{$owner} can't see any of this, so the surprise is safe.")
            // No names in the button label: Laravel repeats it in the footer as Markdown.
            ->action('View their wishlist', config('app.frontend_url')."/wishlists/{$this->ownerId}")
            ->settingsFooter(EmailKind::Nudges);
    }

    public function toWebPush(User $notifiable): WebPushMessage
    {
        return FestivePush::make(
            "🔔 Still getting {$this->itemName}?",
            ($this->nudgerName ?? 'Someone')." is wondering if you're still getting it for {$this->ownerName}. Mark it bought, or undo your claim.",
            "/wishlists/{$this->ownerId}",
        );
    }
}
