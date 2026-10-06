<?php

namespace App\Actions\Groups;

use App\Models\Group;
use App\Models\SecretSantaAssignment;
use App\Models\User;
use App\Models\WishlistClaim;
use App\Notifications\EmptyWishlistReminder;
use App\Notifications\ShoppingReminder;
use Illuminate\Database\Eloquent\Collection;
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
            ->with('drawMembers')
            ->get();

        foreach ($groups as $group) {
            $daysLeft = (int) $today->diffInDays($group->exchange_date);

            if ($this->claim($group, 'empty_wishlist')) {
                $sent += $this->remindEmptyWishlists($group, $daysLeft);
            }

            if ($daysLeft <= self::SHOPPING_DAYS && $group->drawn_at !== null && $this->claim($group, 'shopping')) {
                $sent += $this->remindSantas($group, $daysLeft, $today);
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
        // Only people in the draw: anyone sitting it out has no Santa waiting on their list.
        $empty = $group->drawMembers->filter(
            fn (User $member) => ! $member->wishlistItems()->whereNull('received_at')->exists()
        );

        $empty->each(fn (User $member) => $member->notify(new EmptyWishlistReminder(
            groupName: $group->name,
            exchangeDate: $this->dateLabel($group),
            daysLeft: $daysLeft,
        )));

        return $empty->count();
    }

    /**
     * Santas who've already marked a gift bought for their person are left alone. Someone who
     * drew the same person in several groups needs that many gifts, so it counts gifts against
     * draws. Only shopping since those draws counts: claims never lapse, so last year's gifts
     * would otherwise look like this year's.
     *
     * Other groups only count while their exchange is still coming up: a group whose exchange
     * has passed (or was never dated) may still be on last year's draw, which isn't a gift
     * anyone needs to buy now.
     */
    private function remindSantas(Group $group, int $daysLeft, Carbon $today): int
    {
        $sent = 0;

        foreach ($group->currentAssignments()->with('giver', 'receiver')->get() as $assignment) {
            $giver = $assignment->giver;
            $receiver = $assignment->receiver;
            $draws = $giver->secretSantaRecipients()->filter(fn (SecretSantaAssignment $drawn) => $drawn->receiver_id === $receiver->id
                && ($drawn->group_id === $group->id || $drawn->group->exchange_date?->greaterThanOrEqualTo($today) === true));
            $since = $this->earliestDraw($draws->all(), $group);
            $claims = $this->claimsSince($giver, $receiver, $since);
            $bought = $claims->filter(
                fn (WishlistClaim $claim) => $claim->purchased_at !== null && $claim->purchased_at->greaterThanOrEqualTo($since)
            )->count();

            if ($bought >= $draws->count()) {
                continue;
            }

            $giver->notify(new ShoppingReminder(
                groupName: $group->name,
                exchangeDate: $this->dateLabel($group),
                daysLeft: $daysLeft,
                budget: $group->budgetLabel(),
                recipientId: $receiver->id,
                recipientName: $receiver->name,
                giftsNeeded: $draws->count(),
                drawnInGroups: $draws->map(fn (SecretSantaAssignment $drawn) => $drawn->group->name)->values()->all(),
                claimed: $claims->count(),
                recipientItemCount: $receiver->wishlistItems()->whereNull('received_at')->count(),
            ));
            $sent++;
        }

        return $sent;
    }

    /**
     * When the earliest of these draws happened: shopping before then was for an earlier exchange.
     *
     * @param  array<int, SecretSantaAssignment>  $draws
     */
    private function earliestDraw(array $draws, Group $group): Carbon
    {
        $earliest = Carbon::parse($group->drawn_at);

        foreach ($draws as $drawn) {
            if ($drawn->group->drawn_at !== null && $earliest->greaterThan($drawn->group->drawn_at)) {
                $earliest = Carbon::parse($drawn->group->drawn_at);
            }
        }

        return $earliest;
    }

    /**
     * The giver's claims on the receiver's open items (wishlist and gift ideas) that were made,
     * or marked bought, since the given time.
     *
     * @return Collection<int, WishlistClaim>
     */
    private function claimsSince(User $giver, User $receiver, Carbon $since): Collection
    {
        return WishlistClaim::query()
            // A kid's or pet's gift is bought by the people looking after them.
            ->whereIn('user_id', $giver->actingUserIds())
            ->whereHas('item', fn ($items) => $items->where('user_id', $receiver->id)->whereNull('received_at'))
            ->where(fn ($recent) => $recent->where('claimed_at', '>=', $since)->orWhere('purchased_at', '>=', $since))
            ->get();
    }

    private function dateLabel(Group $group): string
    {
        return $group->exchange_date?->format('l, F j') ?? '';
    }
}
