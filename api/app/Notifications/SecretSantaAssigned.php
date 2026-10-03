<?php

namespace App\Notifications;

use App\Models\Group;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Support\HtmlString;

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

    public function toMail(User $notifiable): ElfMailMessage
    {
        $wishlistUrl = config('app.frontend_url')."/wishlists/{$this->recipient->id}";

        return (new ElfMailMessage)
            ->subject("🎁 Your Secret Santa assignment for {$this->group->name}")
            ->greeting('Hi '.ElfMailMessage::plain($notifiable->name).'!')
            ->line('I have news straight from the North Pole!')
            ->line('The names have been drawn for **'.ElfMailMessage::plain($this->group->name).'**.')
            ->when($this->group->description, fn (ElfMailMessage $message, string $description) => $message
                ->line($this->ownerNote($description)))
            ->line('You are the Secret Santa for:')
            ->line('## '.ElfMailMessage::plain($this->recipient->name))
            ->line('Keep it a secret, and happy gifting! 🎄')
            // No names in the button label: Laravel repeats it in the footer as Markdown, where a
            // crafted name would become a link. The name is shown escaped just above instead.
            ->action('View Their Wishlist', $wishlistUrl);
    }

    /**
     * The owner's note exactly as typed. line() would merge its lines, so this builds the
     * HTML itself: Markdown-escaped (the email body is still parsed as Markdown, so "[x](y)"
     * would otherwise become a link), then HTML-escaped, with real line breaks.
     */
    private function ownerNote(string $description): HtmlString
    {
        // This line is raw HTML (to keep line breaks), so HTML-escape on top of the Markdown escape.
        $escape = fn (string $text): string => e(ElfMailMessage::plain($text));

        return new HtmlString(
            '<strong>A note from '.$escape($this->group->owner->name).':</strong><br>'.nl2br($escape($description), false),
        );
    }
}
