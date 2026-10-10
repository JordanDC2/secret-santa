<?php

namespace App\Notifications;

use App\Enums\EmailKind;
use App\Models\SantaMessage;
use App\Models\User;
use App\Notifications\Concerns\RespectsNotificationPreferences;
use App\Notifications\Contracts\OptionalEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Tries;
use NotificationChannels\WebPush\WebPushMessage;

/**
 * A new message in a Santa ↔ person thread. Only sent for the first unread message, and only
 * if it's still unread WAIT_MINUTES later, so a back-and-forth in the app doesn't flood
 * anyone's inbox. Leaves out the message itself so people reply in the app, which also marks
 * it read and lets the next message email them again.
 */
#[Tries(4)]
#[Backoff(10, 60, 300)]
class SantaMessageReceived extends Notification implements OptionalEmail, ShouldQueue
{
    use Queueable, RespectsNotificationPreferences;

    /** Long enough that someone with the chat open has read it, short enough to still feel prompt. */
    public const WAIT_MINUTES = 5;

    /**
     * @param  bool  $fromSanta  Whether the Santa wrote it, i.e. this goes to their person.
     * @param  string  $personName  The Santa's person. Only ever shown to the Santa, and only by email.
     * @param  bool  $emailToo  Only the first unread message of a run is emailed; every one is pushed.
     */
    public function __construct(
        /** The message being notified about; reading it cancels anything not sent yet. */
        public readonly int $messageId,
        public readonly int $groupId,
        public readonly string $groupName,
        public readonly bool $fromSanta,
        public readonly string $personName,
        /** Set when the reader is a kid or pet: the link opens the chat as them. */
        public readonly ?int $asProfileId = null,
        public readonly bool $emailToo = true,
    ) {}

    /**
     * Pushes go straight away; the email waits WAIT_MINUTES, so someone chatting in the app
     * (who reads it before then) gets no email at all.
     *
     * @return array<string, mixed>
     */
    public function withDelay(object $notifiable, string $channel): array
    {
        return ['mail' => now()->addMinutes(self::WAIT_MINUTES)];
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = $this->preferredChannels($notifiable);

        return $this->emailToo ? $channels : array_values(array_diff($channels, ['mail']));
    }

    /**
     * Checked again when each channel sends: skip it if they've read the message since.
     */
    public function shouldSend(User $notifiable, string $channel): bool
    {
        return SantaMessage::query()->whereKey($this->messageId)->whereNull('read_at')->exists();
    }

    public function toWebPush(User $notifiable): WebPushMessage
    {
        $who = new Addressee($notifiable);
        $side = $this->fromSanta ? 'my-santa' : 'my-person';

        // Never the person's name: it could show on the Santa's lock screen in front of them.
        return FestivePush::make(
            $this->fromSanta ? "🎅 {$who->your(startOfSentence: true)} Secret Santa sent a message" : '💌 Your Secret Santa person wrote back',
            "In {$this->groupName}. Tap to reply.",
            "/?group={$this->groupId}&chat={$side}".($this->asProfileId ? "&as={$this->asProfileId}" : ''),
            // Keep in step with chatPushTag() in web/src/Components/SantaChat/types.ts.
            tag: "chat-{$this->groupId}-{$side}".($this->asProfileId ? "-{$this->asProfileId}" : ''),
        );
    }

    public function emailKind(): EmailKind
    {
        return EmailKind::SantaChat;
    }

    public function toMail(User $notifiable): ElfMailMessage
    {
        $group = ElfMailMessage::plain($this->groupName);
        $side = $this->fromSanta ? 'my-santa' : 'my-person';
        $who = new Addressee($notifiable);
        $message = (new ElfMailMessage)->greeting($who->greeting());

        if ($this->fromSanta) {
            $message->subject($who->isManaged()
                ? "🎅 {$notifiable->first_name}'s Secret Santa sent a message in {$this->groupName}"
                : "🎅 Your Secret Santa sent you a message in {$this->groupName}")
                ->line("{$who->your(startOfSentence: true)} Secret Santa in **{$group}** has a question for {$who->you()}!")
                ->line($who->isManaged()
                    ? "Reply in the app for {$who->name()}. Their Santa will see the answer, but nobody finds out who they are. That's half the fun."
                    : "Reply in the app. They'll see your answer, but you won't find out who they are. That's half the fun.");
        } else {
            $person = ElfMailMessage::plain($this->personName);
            $message->subject($who->isManaged()
                ? "💌 {$this->personName} wrote back to {$notifiable->first_name}"
                : "💌 {$this->personName} wrote back to their Secret Santa")
                ->line($who->isManaged()
                    ? "{$person} sent a message to their Secret Santa, {$who->name()}, in **{$group}**."
                    : "{$person} sent a message to their Secret Santa in **{$group}**.")
                ->line("Have a look in the app. {$person} still has no idea it's {$who->you()}.");
        }

        return $message
            ->line("I'll only email about the first new message, so open the app to keep up with any more.")
            ->action('Open the conversation', config('app.frontend_url')."/?group={$this->groupId}&chat={$side}".($this->asProfileId ? "&as={$this->asProfileId}" : ''))
            ->settingsFooter(EmailKind::SantaChat, $who);
    }
}
