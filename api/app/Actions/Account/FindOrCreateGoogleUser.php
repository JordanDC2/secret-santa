<?php

namespace App\Actions\Account;

use App\Models\User;
use App\Support\Google\GoogleProfile;
use Illuminate\Support\Str;

class FindOrCreateGoogleUser
{
    /**
     * The account a Google sign-in belongs to: the one already linked to that Google account,
     * else the one with the same email (now linked), else a new one. Null if the email belongs
     * to a kid or pet, which can never sign in.
     *
     * A new account has wasRecentlyCreated set, so the caller can announce it.
     */
    public function __invoke(GoogleProfile $profile): ?User
    {
        $user = User::where('google_id', $profile->googleId)->first();

        if ($user) {
            return $user;
        }

        $user = User::where('email', $profile->email)->first();

        if ($user?->isManagedProfile()) {
            return null;
        }

        if ($user) {
            $this->link($user, $profile);

            return $user;
        }

        $user = new User([
            'first_name' => $profile->firstName,
            'last_name' => $profile->lastName,
            'email' => $profile->email,
        ]);
        $user->forceFill([
            'google_id' => $profile->googleId,
            // Google has confirmed the address, so there's nothing for us to confirm.
            'email_verified_at' => now(),
        ])->save();

        return $user;
    }

    /**
     * Google has confirmed the address is theirs. If we hadn't, someone else may have signed up
     * with it first (hoping to share the account once the real owner arrives), so that
     * password stops working and anyone signed in with it is signed out.
     */
    private function link(User $user, GoogleProfile $profile): void
    {
        $user->forceFill(['google_id' => $profile->googleId]);

        if (! $user->hasVerifiedEmail()) {
            $user->forceFill([
                'password' => null,
                'remember_token' => Str::random(60),
                'email_verified_at' => now(),
            ]);
            $user->endOtherSessions();
        }

        $user->save();
    }
}
