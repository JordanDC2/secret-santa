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

/** Three weeks before an exchange: your wishlist is empty, so your Santa has nothing to go on. */
#[Tries(4)]
#[Backoff(10, 60, 300)]
class EmptyWishlistReminder extends Notification implements OptionalEmail, ShouldQueue
{
    use Queueable, RespectsNotificationPreferences;

    public function __construct(
        public readonly string $groupName,
        public readonly string $exchangeDate,
        public readonly int $daysLeft,
    ) {}

    public function emailKind(): EmailKind
    {
        return EmailKind::Reminders;
    }

    public function toMail(User $notifiable): ElfMailMessage
    {
        $group = ElfMailMessage::plain($this->groupName);

        $who = new Addressee($notifiable);

        return (new ElfMailMessage)
            ->subject("📝 Your Secret Santa needs some ideas for {$this->groupName}")
            ->greeting($who->greeting())
            ->line("The **{$group}** gift exchange is {$this->daysLeft} days away, on {$this->exchangeDate}, and {$who->your()} wishlist is still empty.")
            ->line($who->isManaged()
                ? "Add a few things {$who->name()} would love, so their Secret Santa has something to go on. Sizes, favourite colours and links all help!"
                : "Add a few things you'd love, so your Secret Santa has something to go on. Sizes, favourite colours and links all help!")
            // No names in the button label: Laravel repeats it in the footer as Markdown.
            ->action($who->isManaged() ? 'Add to Their Wishlist' : 'Add to Your Wishlist', config('app.frontend_url').'/wishlist'.($who->isManaged() ? "?for={$notifiable->id}" : ''))
            ->settingsFooter(EmailKind::Reminders, $who);
    }

    public function toWebPush(User $notifiable): WebPushMessage
    {
        $who = new Addressee($notifiable);

        return FestivePush::make(
            "📝 {$who->your(startOfSentence: true)} wishlist is empty",
            "The {$this->groupName} exchange is {$this->daysLeft} days away. Add a few ideas for {$who->your()} Secret Santa.",
            '/wishlist'.($who->isManaged() ? "?for={$notifiable->id}" : ''),
        );
    }
}
