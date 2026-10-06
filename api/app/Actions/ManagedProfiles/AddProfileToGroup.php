<?php

namespace App\Actions\ManagedProfiles;

use App\Events\GroupChanged;
use App\Models\Group;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class AddProfileToGroup
{
    /**
     * Puts a kid or pet in one of their manager's groups, where they're a member like anyone
     * else: on the card, with a wishlist everyone can shop, and in the draw (their manager
     * shops for whoever they draw). The same rules as joining apply.
     */
    public function __invoke(User $profile, Group $group): void
    {
        if ($group->members()->whereKey($profile->id)->exists()) {
            throw ValidationException::withMessages(['profile_id' => ["{$profile->first_name} is already in this group."]]);
        }

        if ($group->is_drawn) {
            throw ValidationException::withMessages([
                'profile_id' => ["Names have already been drawn for this group, so it isn't taking new members."],
            ]);
        }

        $group->members()->attach($profile);

        GroupChanged::dispatch($group->id);
    }
}
