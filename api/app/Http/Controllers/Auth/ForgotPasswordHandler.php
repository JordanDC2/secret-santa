<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Password;

class ForgotPasswordHandler extends Controller
{
    public function __invoke(ForgotPasswordRequest $request): JsonResponse
    {
        // The response is the same whether or not the email belongs to an account,
        // so this endpoint can't be used to discover who has signed up.
        Password::sendResetLink($request->only('email'));

        return response()->json([
            'message' => 'If that email has an account, a reset link is on its way.',
        ]);
    }
}
