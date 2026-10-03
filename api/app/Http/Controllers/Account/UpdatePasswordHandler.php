<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Http\Requests\Account\UpdatePasswordRequest;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

class UpdatePasswordHandler extends Controller
{
    public function __invoke(UpdatePasswordRequest $request): Response
    {
        $user = $request->user();

        $user->forceFill([
            'password' => $request->string('password')->value(),
            'remember_token' => Str::random(60),
        ])->save();

        $user->endOtherSessions($request->hasSession() ? $request->session()->getId() : null);

        return response()->noContent();
    }
}
