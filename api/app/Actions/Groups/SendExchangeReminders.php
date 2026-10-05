<?php

namespace App\Actions\Groups;

use App\Models\Group;
use App\Models\SecretSantaAssignment;
use App\Models\User;
use App\Models\WishlistClaim;
use App\Notifications\EmptyWishlistReminder;
use App\Notifications\ShoppingReminder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class SendExchangeReminders
{
    /** Members with an empty wishlist hear this many days before the exchange. */
    public const EMPTY_WISHLIST_DAYS = 21;

    /** Santas hear this many days before, leaving time for shipping. */
    public const SHOPPING_DAYS = 14;

    /**
     * Run daily. Each reminder goes out once per group and exchange date: as soon as the
     * exchange is within its window, or on the next run after that if it was missed (e.g.
     * the date was set late, or names were drawn after the shopping window opened).
     *
     * @return int How many emails were sent.
     */
    public function __invoke(Carbon $today): int
    {
        $sent = 0;

        $groups = Group::query()
            ->whereDate('exchange_date', '>', $today->toDateString())
            ->whereDate('exchange_date', '<=', $today->copy()->addDays(self::EMPTY_WISHLIST_DAYS)->toDateString())
            ->with('members')
            ->get();

        foreach ($groups as $group) {
            $daysLeft = (int) $today->diffInDays($group->exchange_date);

            if ($this->claim($group, 'empty_wishlist')) {
                $sent += $this->remindEmptyWishlists($group, $daysLeft);
            }

            if ($daysLeft <= self::SHOPPING_DAYS && $group->drawn_at !== null && $this->claim($group, 'shopping')) {
                $sent += $this->remindSantas($group, $daysLeft);
            }
        }

        return $sent;
    }

    /**
     * Records that a reminder is going out; false if it already has for this exchange date,
     * so running twice in a day never sends twice.
     */
    private function claim(Group $group, string $kind): bool
    {
        return DB::table('group_reminders')->insertOrIgnore([
            'group_id' => $group->id,
            'kind' => $kind,
            'exchange_date' => $group->exchange_date?->toDateString(),
            'created_at' => now(),
        ]) === 1;
    }

    private function remindEmptyWishlists(Group $group, int $daysLeft): int
    {
        $empty = $group->members->filter(
            fn (User $member) => ! $member->wishlistItems()->whereNull('received_at')->exists()
        );

        $empty->each(fn (User $member) => $member->notify(new EmptyWishlistReminder(
            groupName: $group->name,
            exchangeDate: $this->dateLabel($group),
            daysLeft: $daysLeft,
        )));

        return $empty->count();
    }

    private function remindSantas(Group $group, int $daysLeft): int
    {
        $assignments = $group->currentAssignments()->with('giver', 'receiver')->get();

        $assignments->each(function (SecretSantaAssignment $assignment) use ($group, $daysLeft) {
            $receiver = $assignment->receiver;

            $assignment->giver->notify(new ShoppingReminder(
                groupName: $group->name,
                exchangeDate: $this->dateLabel($group),
                daysLeft: $daysLeft,
                budget: $group->budgetLabel(),
                recipientId: $receiver->id,
                recipientName: $receiver->name,
                hasClaimed: WishlistClaim::query()
                    ->where('user_id', $assignment->giver_id)
                    ->whereHas('item', fn ($items) => $items->where('user_id', $receiver->id))
                    ->exists(),
                recipientItemCount: $receiver->wishlistItems()->whereNull('received_at')->count(),
            ));
        });

        return $assignments->count();
    }

    private function dateLabel(Group $group): string
    {
        return $group->exchange_date?->format('l, F j') ?? '';
    }
}
