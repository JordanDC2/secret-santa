<?php

namespace App\Http\Controllers\Account;

use App\Events\GroupChanged;
use App\Http\Controllers\Controller;
use App\Http\Requests\Account\UpdateProfileRequest;
use App\Models\User;

class UpdateProfileHandler extends Controller
{
    public function __invoke(UpdateProfileRequest $request): User
    {
        $user = $request->user();
        $user->update($request->safe()->only('first_name', 'last_name', 'email'));

        // Your name shows on other members' group cards, so let them refresh.
        $user->groups()->pluck('groups.id')->each(fn (int $groupId) => GroupChanged::dispatch($groupId));

        return $user;
    }
}
