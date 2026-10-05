<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Tries;

/**
 * Two weeks before an exchange, so there's time for shipping: a nudge to a Santa who hasn't
 * marked their person's gift bought yet, worded by how far along their shopping is.
 */
#[Tries(4)]
#[Backoff(10, 60, 300)]
class ShoppingReminder extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $groupName,
        public readonly string $exchangeDate,
        public readonly int $daysLeft,
        public readonly ?string $budget,
        public readonly int $recipientId,
        public readonly string $recipientName,
        /** One per group this Santa drew the same person in. */
        public readonly int $giftsNeeded,
        /** @var array<int, string> Those groups' names. */
        public readonly array $drawnInGroups,
        /** Claims on the person's list since the draw, bought or not. */
        public readonly int $claimed,
        public readonly int $recipientItemCount,
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
        $group = ElfMailMessage::plain($this->groupName);
        $person = ElfMailMessage::plain($this->recipientName);

        $message = (new ElfMailMessage)
            ->subject("🎁 {$this->daysLeft} days until the {$this->groupName} gift exchange")
            ->greeting('Hi '.ElfMailMessage::plain($notifiable->name).'!')
            ->line("A friendly reminder from the North Pole: the **{$group}** exchange is on {$this->exchangeDate}, {$this->daysLeft} days from now, and you're the Secret Santa for **{$person}**.")
            ->when($this->budget, fn (ElfMailMessage $message, string $budget) => $message->line("The budget is {$budget}."));

        if ($this->giftsNeeded > 1) {
            $groups = collect($this->drawnInGroups)->map(fn (string $name) => ElfMailMessage::plain($name))->join(', ', ' and ');
            $message->line("You drew {$person} in {$this->giftsNeeded} groups ({$groups}), so that's {$this->giftsNeeded} gifts to find.");
        }

        if ($this->claimed >= $this->giftsNeeded) {
            $message->line("You've already claimed something on {$person}'s list. If it still needs ordering, now's a good time, so shipping doesn't spoil the surprise. Mark it bought once it is, and I'll stop reminding you.");
        } elseif ($this->claimed > 0) {
            $more = $this->giftsNeeded - $this->claimed;
            $message->line("You've claimed {$this->claimed} so far, so pick {$more} more from {$person}'s wishlist and order soon in case shipping is slow.");
        } elseif ($this->recipientItemCount > 0) {
            $things = $this->recipientItemCount === 1 ? '1 thing' : "{$this->recipientItemCount} things";
            $message->line("Still deciding? {$person} has {$things} on their wishlist. Claim one so nobody else buys it too, and order soon in case shipping is slow.");
        } else {
            $message->line("{$person}'s wishlist is empty, so you could ask them a question in your Santa chat (they won't know it's you) or add a gift idea for the group.");
        }

        return $message->action('View Their Wishlist', config('app.frontend_url')."/wishlists/{$this->recipientId}");
    }
}
