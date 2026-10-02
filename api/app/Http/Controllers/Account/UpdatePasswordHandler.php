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
        $request->user()->forceFill([
            'password' => $request->string('password')->value(),
            'remember_token' => Str::random(60),
        ])->save();

        return response()->noContent();
    }
}
