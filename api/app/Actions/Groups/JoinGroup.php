<?php

namespace App\Actions\Groups;

use App\Models\Group;
use App\Models\User;
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

        $group->members()->attach($user);

        return $group;
    }
}
