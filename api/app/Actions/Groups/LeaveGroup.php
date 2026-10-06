<?php

namespace App\Actions\Groups;

use App\Events\GroupChanged;
use App\Models\Group;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class LeaveGroup
{
    public function __invoke(User $user, Group $group): void
    {
        // Once drawn, someone is buying for this member and they're buying for someone
        // else, so leaving would break the assignment cycle.
        if ($group->is_drawn) {
            throw ValidationException::withMessages([
                'group' => ["Names have already been drawn, so you can't leave this group."],
            ]);
        }

        $this->removeMember($group, $user);

        // Their kids and pets go with them, unless someone else looking after them stays.
        $user->managedProfiles()
            ->whereHas('groups', fn ($groups) => $groups->whereKey($group->id))
            ->get()
            ->reject(fn (User $profile) => $profile->managers()->whereHas('groups', fn ($groups) => $groups->whereKey($group->id))->exists())
            ->each(fn (User $profile) => $this->removeMember($group, $profile));

        GroupChanged::dispatch($group->id);
    }

    private function removeMember(Group $group, User $member): void
    {
        $group->members()->detach($member);
        $group->exclusions()->where(fn ($query) => $query->where('giver_id', $member->id)->orWhere('receiver_id', $member->id))->delete();
    }
}
