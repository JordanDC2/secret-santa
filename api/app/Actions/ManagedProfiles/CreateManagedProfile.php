<?php

namespace App\Actions\ManagedProfiles;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreateManagedProfile
{
    /**
     * A kid or pet without a login, looked after by the given user. It's an ordinary user row,
     * so groups, wishlists and draws treat it like anyone else, but it can never sign in: its
     * email is a unique placeholder on the reserved .invalid domain (which can't receive mail;
     * its emails go to its managers) and its password is random and never shown to anyone.
     */
    public function __invoke(User $manager, string $firstName, ?string $lastName, string $kind): User
    {
        return DB::transaction(function () use ($manager, $firstName, $lastName, $kind) {
            $profile = User::create([
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => 'profile-'.Str::uuid().'@profiles.invalid',
                'password' => Str::password(48),
                'managed_kind' => $kind,
            ]);

            $profile->managers()->attach($manager);

            return $profile;
        });
    }
}
