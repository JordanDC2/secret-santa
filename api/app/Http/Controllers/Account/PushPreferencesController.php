<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Http\Requests\Account\UpdateEmailPreferencesRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Which kinds of notification are pushed to someone's devices, beside the email switches on
 * Settings. Same kinds and rules as email (UpdateEmailPreferencesRequest validates both).
 */
class PushPreferencesController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json($request->user()->pushPreferences());
    }

    public function update(UpdateEmailPreferencesRequest $request): JsonResponse
    {
        $user = $request->user();
        $changes = collect($request->validated())->map(fn (mixed $on) => (bool) $on)->all();

        $user->update(['push_preferences' => array_merge($user->pushPreferences(), $changes)]);

        return response()->json($user->pushPreferences());
    }
}
