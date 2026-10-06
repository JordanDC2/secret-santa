<?php

namespace App\Actions\Groups;

use App\Events\GroupChanged;
use App\Models\Group;
use App\Models\User;
use App\Notifications\MemberLeftDrawnGroup;
use App\Notifications\SecretSantaPersonChanged;
use App\Support\PersonNames;
use Illuminate\Support\Facades\DB;

class LeaveGroup
{
    /**
     * Anyone but the owner can leave, even after the draw: nobody should be stuck in a group
     * with deleting their account as the only way out. Their kids and pets go with them,
     * unless someone else looking after them stays.
     */
    public function __invoke(User $user, Group $group): void
    {
        $leaving = $user->managedProfiles()
            ->whereHas('groups', fn ($groups) => $groups->whereKey($group->id))
            ->get()
            // Stays if someone else looking after them (not the one leaving) is still in the group.
            ->reject(fn (User $profile) => $profile->managers()->whereKeyNot($user->id)->whereHas('groups', fn ($groups) => $groups->whereKey($group->id))->exists())
            ->prepend($user);

        DB::transaction(function () use ($group, $leaving) {
            foreach ($leaving as $member) {
                $this->leaveDraw($group, $member);
                $this->removeMember($group, $member);
            }
        });

        GroupChanged::dispatch($group->id);
    }

    /**
     * While the exchange is still ahead, mends the draw around someone leaving: the person
     * who drew them takes over the person they drew, so nobody else's match changes. If that
     * can't work (it'd match someone with themselves, or an exclusion forbids it), the owner
     * is asked to draw again. After the exchange there's nothing to mend; the old draw stays
     * as history.
     */
    private function leaveDraw(Group $group, User $member): void
    {
        if (! $group->is_drawn || $group->exchange_date?->lessThan(today()) === true) {
            return;
        }

        $theirAssignment = $group->currentAssignments()->where('giver_id', $member->id)->first();
        $theirSantasAssignment = $group->currentAssignments()->where('receiver_id', $member->id)->with('giver')->first();

        // Sitting this draw out: nobody drew them, and they drew nobody.
        if ($theirAssignment === null && $theirSantasAssignment === null) {
            return;
        }

        // Named as the group showed them, before they're gone from it.
        $name = PersonNames::inGroup($member, $group);
        $santa = $theirSantasAssignment?->giver;
        $person = $theirAssignment?->receiver;

        // Their Santa chats go too (the messages cascade with the assignments).
        $theirAssignment?->delete();
        $theirSantasAssignment?->delete();

        $mendable = $santa !== null && $person !== null && ! $santa->is($person)
            && ! in_array([$santa->id, $person->id], $group->blockedPairsAmong([$santa->id, $person->id]), true);

        if (! $mendable) {
            $group->owner->notify(new MemberLeftDrawnGroup($group, $name));

            return;
        }

        $group->assignments()->create(['draw_number' => $group->draw_number, 'giver_id' => $santa->id, 'receiver_id' => $person->id]);
        $santa->notify(new SecretSantaPersonChanged($group, $person, $name));
    }

    private function removeMember(Group $group, User $member): void
    {
        $group->members()->detach($member);
        $group->exclusions()->where(fn ($query) => $query->where('giver_id', $member->id)->orWhere('receiver_id', $member->id))->delete();
    }
}
