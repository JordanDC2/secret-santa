<?php

namespace App\Actions\ManagedProfiles;

use App\Models\User;
use Illuminate\Validation\ValidationException;

class RemoveCoParent
{
    /**
     * Stops someone looking after a kid or pet (including yourself). Someone always has to:
     * to drop the last one, remove the kid or pet instead.
     */
    public function __invoke(User $profile, User $manager): void
    {
        if ($profile->managers()->count() <= 1) {
            throw ValidationException::withMessages([
                'manager' => ["{$profile->first_name} needs someone looking after them. To stop entirely, remove {$profile->first_name} instead."],
            ]);
        }

        $profile->managers()->detach($manager);
    }
}
