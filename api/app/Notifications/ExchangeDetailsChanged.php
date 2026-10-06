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
 * Tells a group's members that the owner set, moved or removed the exchange date or budget.
 * The before and after values are captured when the owner saves, since the queued email
 * reloads the group when it sends.
 */
#[Tries(4)]
#[Backoff(10, 60, 300)]
class ExchangeDetailsChanged extends Notification implements OptionalEmail, ShouldQueue
{
    use Queueable, RespectsEmailPreferences;

    public function __construct(
        public readonly Group $group,
        public readonly string $ownerName,
        public readonly ?string $dateBefore,
        public readonly ?string $dateAfter,
        public readonly ?string $budgetBefore,
        public readonly ?string $budgetAfter,
    ) {}

    public function emailKind(): EmailKind
    {
        return EmailKind::ExchangeUpdates;
    }

    public function toMail(User $notifiable): ElfMailMessage
    {
        $groupName = ElfMailMessage::plain($this->group->name);
        $message = (new ElfMailMessage)
            ->subject("📅 {$this->group->name}: {$this->whatChanged()}")
            ->greeting('Hi '.ElfMailMessage::plain($notifiable->first_name).'!')
            ->line(ElfMailMessage::plain($this->ownerName)." updated the exchange details for **{$groupName}**:");

        if ($this->dateBefore !== $this->dateAfter) {
            $message->line($this->change('Exchange date', $this->dateBefore, $this->dateAfter));
        }

        if ($this->budgetBefore !== $this->budgetAfter) {
            $message->line($this->change('Budget', $this->budgetBefore, $this->budgetAfter));
        }

        return $message
            ->action('View Your Groups', config('app.frontend_url').'/')
            ->settingsFooter(EmailKind::ExchangeUpdates);
    }

    /** "exchange date changed", "budget changed" or "exchange date and budget changed" */
    private function whatChanged(): string
    {
        $changed = array_filter([
            $this->dateBefore !== $this->dateAfter ? 'exchange date' : null,
            $this->budgetBefore !== $this->budgetAfter ? 'budget' : null,
        ]);

        return implode(' and ', $changed).' changed';
    }

    /** "**Budget:** $30–$50 (was $25)", "**Budget:** $30 (new)" or "**Budget:** removed (was $25)" */
    private function change(string $label, ?string $before, ?string $after): string
    {
        $now = $after === null ? 'removed' : '**'.ElfMailMessage::plain($after).'**';
        $was = $before === null ? 'new' : 'was '.ElfMailMessage::plain($before);

        return "{$label}: {$now} ({$was})";
    }
}
