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
use Illuminate\Support\HtmlString;
use Illuminate\Support\Str;
use Symfony\Component\Mime\Email;

#[Tries(4)]
#[Backoff(10, 60, 300)]
class SecretSantaAssigned extends Notification implements OptionalEmail, ShouldQueue
{
    use Queueable, RespectsEmailPreferences;

    /**
     * Subjects for later draws (a re-draw, or next year's exchange), in turn. Gmail threads emails
     * with the same subject and hides repeated text as "quoted", which would bury a new assignment
     * under the old one, so each draw gets a different subject.
     */
    private const LATER_DRAW_SUBJECTS = [
        '❄️ A fresh draw from the North Pole for %s',
        '🎄 The names are in! Your Secret Santa for %s',
        "⭐ Santa's list is ready: your Secret Santa for %s",
        '🦌 Word from the North Pole: your Secret Santa for %s',
    ];

    /**
     * @param  int  $drawNumber  Captured when the draw happens, because the queued email reloads the
     *                           group when it sends, by which time the owner could have drawn again.
     */
    public function __construct(
        public readonly Group $group,
        public readonly User $recipient,
        public readonly int $drawNumber = 1,
    ) {}

    public function emailKind(): EmailKind
    {
        return EmailKind::Assignments;
    }

    public function toMail(User $notifiable): ElfMailMessage
    {
        $who = new Addressee($notifiable);
        $wishlistUrl = config('app.frontend_url')."/wishlists/{$this->recipient->id}";
        $groupName = ElfMailMessage::plain($this->group->name);
        $isRedraw = $this->drawNumber > 1;

        return (new ElfMailMessage)
            ->subject($this->subjectLine($notifiable))
            // Unique per email. Undocumented, but some say it stops Gmail hiding repeated text.
            ->withSymfonyMessage(fn (Email $message) => $message->getHeaders()->addTextHeader('X-Entity-Ref-ID', (string) Str::uuid()))
            ->greeting($who->greeting())
            ->line('I have news straight from the North Pole!')
            ->line($isRedraw
                ? "The names have been drawn again for **{$groupName}**. This replaces any earlier assignment in this group."
                : "The names have been drawn for **{$groupName}**.")
            ->when($this->group->description, fn (ElfMailMessage $message, string $description) => $message
                ->line($this->ownerNote($description)))
            ->line($who->isManaged() ? "{$who->name()} is the Secret Santa for:" : 'You are the Secret Santa for:')
            ->line('## '.ElfMailMessage::plain($this->recipient->name))
            ->when($this->exchangeDetails(), fn (ElfMailMessage $message, string $details) => $message->line($details))
            ->line('Keep it a secret, and happy gifting! 🎄')
            // No names in the button label: Laravel repeats it in the footer as Markdown, where a
            // crafted name would become a link. The name is shown escaped just above instead.
            ->action('View Their Wishlist', $wishlistUrl)
            ->settingsFooter(EmailKind::Assignments, $who);
    }

    /**
     * "The exchange is on Saturday, December 20, and the budget is $30–$50.", or whichever
     * half is set; null when neither is.
     */
    private function exchangeDetails(): ?string
    {
        $date = $this->group->exchange_date?->format('l, F j');
        $budget = $this->group->budgetLabel();

        return match (true) {
            $date !== null && $budget !== null => "The exchange is on {$date}, and the budget is {$budget}.",
            $date !== null => "The exchange is on {$date}.",
            $budget !== null => "The budget is {$budget}.",
            default => null,
        };
    }

    /**
     * For a kid or pet, "your" becomes their name, so their parents can tell whose it is.
     */
    private function subjectLine(User $notifiable): string
    {
        $subject = $this->drawNumber <= 1
            ? "🎁 Your Secret Santa assignment for {$this->group->name}"
            : sprintf(self::LATER_DRAW_SUBJECTS[($this->drawNumber - 2) % count(self::LATER_DRAW_SUBJECTS)], $this->group->name);

        return $notifiable->isManagedProfile()
            ? str_ireplace('your Secret Santa', "{$notifiable->name}'s Secret Santa", $subject)
            : $subject;
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
