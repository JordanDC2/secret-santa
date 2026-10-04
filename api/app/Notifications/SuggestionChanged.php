<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Tries;

/**
 * Tells a suggester that someone else edited or removed their gift idea. Carries plain values
 * rather than the item, so it still sends after the suggestion is gone.
 */
#[Tries(4)]
#[Backoff(10, 60, 300)]
class SuggestionChanged extends Notification implements ShouldQueue
{
    use Queueable;

    private const FIELD_LABELS = [
        'name' => 'Name',
        'price' => 'Price',
        'quantity' => 'How many',
        'notes' => 'Notes',
        'url' => 'Link',
        'image_url' => 'Picture',
    ];

    /**
     * @param  array<string, array{mixed, mixed}>  $changes  Field => [before, after].
     */
    public function __construct(
        public readonly int $ownerId,
        public readonly string $ownerName,
        public readonly string $itemName,
        public readonly ?string $editorName,
        public readonly array $changes,
        public readonly bool $removed,
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
        $owner = ElfMailMessage::plain($this->ownerName);
        $who = $this->editorName === null ? 'Someone' : ElfMailMessage::plain($this->editorName);
        $what = $this->removed ? 'removed' : 'edited';

        $message = (new ElfMailMessage)
            ->subject("🎁 Your gift idea for {$this->ownerName} was {$what}")
            ->greeting('Hi '.ElfMailMessage::plain($notifiable->name).'!')
            ->line("{$who} {$what} the gift idea you suggested for {$owner}: **".ElfMailMessage::plain($this->itemName).'**.');

        foreach ($this->changes as $field => [, $after]) {
            $message->line('**'.(self::FIELD_LABELS[$field] ?? $field).':** '.$this->describe($field, $after));
        }

        return $message
            ->line("Don't worry, {$owner} still can't see any of the gift ideas on their list.")
            // No names in the button label: Laravel repeats it in the footer as Markdown.
            ->action('View Their Wishlist', config('app.frontend_url')."/wishlists/{$this->ownerId}");
    }

    private function describe(string $field, mixed $value): string
    {
        return match (true) {
            $value === null || $value === '' => '_removed_',
            $field === 'price' => '$'.number_format((float) $value, 2),
            in_array($field, ['url', 'image_url'], true) => 'changed',
            default => ElfMailMessage::plain((string) $value),
        };
    }
}
