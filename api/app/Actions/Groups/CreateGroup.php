<?php

namespace App\Actions\Groups;

use App\Models\Group;
use App\Models\User;

class CreateGroup
{
    public function __invoke(User $owner, string $name): Group
    {
        $group = Group::create([
            'name' => $name,
            'owner_id' => $owner->id,
        ]);

        $group->members()->attach($owner);

        return $group;
    }
}
