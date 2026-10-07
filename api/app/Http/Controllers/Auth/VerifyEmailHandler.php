<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Where the "Confirm my email" link goes. No login needed: the link is signed and expires, so
 * opening it proves they can read the inbox (often on a phone that isn't signed in). Sends them
 * on to the React app's /email-verified page, which says how it went.
 */
class VerifyEmailHandler extends Controller
{
    public function __invoke(Request $request, User $user, string $hash): RedirectResponse
    {
        // The hash is of the address the email went to: after an email change, old links stop working.
        $valid = $request->hasValidSignature()
            && ! $user->isManagedProfile()
            && hash_equals(sha1($user->getEmailForVerification()), $hash);

        if (! $valid) {
            return $this->toApp('expired');
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        return $this->toApp('confirmed');
    }

    private function toApp(string $status): RedirectResponse
    {
        return redirect()->away(config('app.frontend_url').'/email-verified?status='.$status);
    }
}
