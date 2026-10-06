<?php

namespace App\Actions\Groups;

use App\Models\Group;
use App\Models\User;
use App\Notifications\ExchangeDetailsChanged;
use App\Support\PersonNames;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;

class NotifyMembersOfExchangeChange
{
    /**
     * After the owner saves the group, emails everyone else in it if the exchange date or
     * budget changed (set, moved or removed). Kids and pets don't get their own copy: their
     * parents do, once each, whether or not they're in the group themselves.
     *
     * @param  string|null  $dateBefore  "YYYY-MM-DD", as it was before the save.
     * @param  string|null  $budgetBefore  Group::budgetLabel(), as it was before the save.
     */
    public function __invoke(Group $group, User $editor, ?string $dateBefore, ?string $budgetBefore): void
    {
        $dateAfter = $group->exchange_date?->toDateString();
        $budgetAfter = $group->budgetLabel();

        if ($dateAfter === $dateBefore && $budgetAfter === $budgetBefore) {
            return;
        }

        $recipients = $group->members()->with('managers')->get()
            ->flatMap(fn (User $member) => $member->isManagedProfile() ? $member->managers : [$member])
            ->unique('id')
            ->reject(fn (User $person) => $person->is($editor))
            ->values();

        Notification::send($recipients, new ExchangeDetailsChanged(
            group: $group,
            ownerName: PersonNames::inGroup($editor, $group),
            dateBefore: $this->dateLabel($dateBefore),
            dateAfter: $this->dateLabel($dateAfter),
            budgetBefore: $budgetBefore,
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
