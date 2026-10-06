<?php

namespace App\Actions\ManagedProfiles;

use App\Models\User;
use App\Notifications\ProfileShared;
use Illuminate\Validation\ValidationException;

class AddCoParent
{
    /**
     * Shares looking after a kid or pet with someone from the sharer's groups: they get the
     * same say (wishlist, claims, draws and Santa chats) and an email telling them so.
     */
    public function __invoke(User $sharer, User $profile, User $coParent): void
    {
        if ($coParent->isManagedProfile() || ! $sharer->sharesGroupWith($coParent)) {
            throw ValidationException::withMessages(['user_id' => ['Pick someone from one of your groups.']]);
        }

        if ($coParent->manages($profile)) {
            throw ValidationException::withMessages(['user_id' => ["{$coParent->name} already looks after {$profile->name}."]]);
        }

        $profile->managers()->attach($coParent);

        $coParent->notify(new ProfileShared(
            sharerName: $sharer->name,
            profileId: $profile->id,
            profileName: $profile->name,
            isPet: $profile->managed_kind === 'pet',
        ));
    }
}
