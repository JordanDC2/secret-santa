<?php

namespace App\Jobs;

use App\Models\Group;
use App\Models\User;
use App\Notifications\ExchangeDetailsChanged;
use App\Support\PersonNames;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Notification;

/**
 * Emails a group's members about its new exchange date or budget, a few minutes after the
 * owner's last change, so a burst of edits becomes one email (see
 * NotifyMembersOfExchangeChange). It compares what the members last heard about (the values
 * from before the first edit) with the group as it is now, so an edit that's undone sends
 * nothing.
 */
class SendExchangeChangeEmail implements ShouldQueue
{
    use Queueable;

    /**
     * @param  string  $version  Which save queued this; a later save queues its own job and this one does nothing.
     */
    public function __construct(
        public readonly int $groupId,
        public readonly string $version,
    ) {}

    /**
     * Where the pending change waits: the values from before the first edit, who made the
     * latest one, and which save's job may send it.
     */
    public static function pendingKey(int $groupId): string
    {
        return "exchange-change:{$groupId}";
    }

    public function handle(): void
    {
        $key = self::pendingKey($this->groupId);

        /** @var array{date_before: ?string, budget_before: ?string, editor_id: int, version: string}|null $pending */
        $pending = Cache::lock("{$key}:lock", 10)->block(5, function () use ($key) {
            $pending = Cache::get($key);
            if (! is_array($pending) || $pending['version'] !== $this->version) {
                return null;
            }

            Cache::forget($key);

            return $pending;
        });

        $group = $pending === null ? null : Group::find($this->groupId);
        if ($pending === null || $group === null) {
            return;
        }

        $dateAfter = $group->exchange_date?->toDateString();
        $budgetAfter = $group->budgetLabel();
        if ($dateAfter === $pending['date_before'] && $budgetAfter === $pending['budget_before']) {
            return;
        }

        $editor = User::find($pending['editor_id']) ?? $group->owner;

        // Kids and pets don't get their own copy: their parents do, once each, whether or
        // not they're in the group themselves.
        $recipients = $group->members()->with('managers')->get()
            ->flatMap(fn (User $member) => $member->isManagedProfile() ? $member->managers : [$member])
            ->unique('id')
            ->reject(fn (User $person) => $person->is($editor))
            ->values();

        Notification::send($recipients, new ExchangeDetailsChanged(
            group: $group,
            ownerName: PersonNames::inGroup($editor, $group),
            dateBefore: $this->dateLabel($pending['date_before']),
            dateAfter: $this->dateLabel($dateAfter),
            budgetBefore: $pending['budget_before'],
            budgetAfter: $budgetAfter,
        ));
    }

    /**
     * "Saturday, December 20, 2026": with the year, since dates can be up to two years out.
     */
    private function dateLabel(?string $date): ?string
    {
        return $date === null ? null : Carbon::parse($date)->format('l, F j, Y');
    }
}
