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

        $group->members()->detach($user);
        $group->exclusions()->where(fn ($query) => $query->where('giver_id', $user->id)->orWhere('receiver_id', $user->id))->delete();

        GroupChanged::dispatch($group->id);
    }
}
