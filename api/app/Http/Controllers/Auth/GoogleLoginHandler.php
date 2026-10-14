<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Account\FindOrCreateGoogleUser;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\GoogleLoginRequest;
use App\Models\User;
use App\Support\Google\GoogleIdTokenVerifier;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

/**
 * "Continue with Google": logs in, linking or creating the account as needed.
 */
class GoogleLoginHandler extends Controller
{
    public function __invoke(GoogleLoginRequest $request, GoogleIdTokenVerifier $verifier, FindOrCreateGoogleUser $findOrCreate): User
    {
        $profile = $verifier->verify($request->string('credential')->value());
        $user = $profile ? $findOrCreate($profile) : null;

        if (! $user) {
            throw ValidationException::withMessages([
                'credential' => ['Google couldn\'t confirm who you are. Please try again.'],
            ]);
        }

        // Tells the site owner about the new account. Its email is already confirmed, so no
        // "confirm your email" email goes out.
        if ($user->wasRecentlyCreated) {
            event(new Registered($user));
        }

        Auth::login($user);

        $request->session()->regenerate();

        return $user;
    }
}
