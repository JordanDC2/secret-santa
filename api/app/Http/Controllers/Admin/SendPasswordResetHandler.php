<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Password;

/**
 * Emails someone the same reset link "Forgot password?" sends, for when they're stuck.
 */
class SendPasswordResetHandler extends Controller
{
    public function __invoke(User $user): JsonResponse
    {
        abort_if($user->isManagedProfile(), 404);

        $status = Password::sendResetLink(['email' => $user->email]);

        abort_if($status === Password::RESET_THROTTLED, 429, 'A reset link was sent to them a moment ago. Try again in a minute.');

        return response()->json(['message' => "A reset link is on its way to {$user->email}."]);
    }
}
