<?php

namespace App\Actions\Groups;

use App\Events\GroupChanged;
use App\Models\Group;
use App\Models\User;
use App\Notifications\MemberJoinedGroup;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class JoinGroup
{
    public function __invoke(User $user, string $joinCode): Group
    {
        $group = Group::where('join_code', Str::upper($joinCode))->first();

        if (! $group) {
            throw ValidationException::withMessages([
                'join_code' => ['No group was found with that join code.'],
            ]);
        }

        if ($group->members()->where('user_id', $user->id)->exists()) {
            throw ValidationException::withMessages([
                'join_code' => ['You are already a member of this group.'],
            ]);
        }

        // Everyone's assignment was set at the draw, so a newcomer would have no one to
        // buy for and no one buying for them.
        if ($group->is_drawn) {
            throw ValidationException::withMessages([
                'join_code' => ["Names have already been drawn for this group, so it isn't taking new members."],
            ]);
        }

        $group->members()->attach($user);

        GroupChanged::dispatch($group->id);

        $group->owner->notify(new MemberJoinedGroup($group, $user, $group->members()->count()));

        return $group;
    }
}
