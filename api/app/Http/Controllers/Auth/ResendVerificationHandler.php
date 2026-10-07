<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The banner's "Send it again" button.
 */
class ResendVerificationHandler extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Your email is already confirmed.']);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['message' => "A new link is on its way to {$user->email}."], 202);
    }
}
