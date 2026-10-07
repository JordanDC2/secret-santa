<?php

namespace App\Http\Controllers\Account;

use App\Events\GroupChanged;
use App\Http\Controllers\Controller;
use App\Http\Requests\Account\UpdateProfileRequest;
use App\Models\User;
use App\Notifications\EmailAddressChanged;
use Illuminate\Support\Facades\Notification;

class UpdateProfileHandler extends Controller
{
    public function __invoke(UpdateProfileRequest $request): User
    {
        $user = $request->user();
        $oldEmail = $user->email;
        $user->fill($request->safe()->only('first_name', 'last_name', 'email'));
        $emailChanged = $user->isDirty('email');

        // A new address needs confirming (it's how typos get caught), and the old one hears about
        // the change in case it wasn't them.
        if ($emailChanged) {
            $user->email_verified_at = null;
        }

        $user->save();

        if ($emailChanged) {
            $user->sendEmailVerificationNotification();
            Notification::route('mail', $oldEmail)->notify(new EmailAddressChanged($user->first_name));
        }

        // Your name shows on other members' group cards, so let them refresh.
        $user->groups()->pluck('groups.id')->each(fn (int $groupId) => GroupChanged::dispatch($groupId));

        return $user;
    }
}
