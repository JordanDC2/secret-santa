<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Http\Requests\Account\UpdateEmailPreferencesRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Which optional emails someone gets. Both actions answer with every kind and whether it's on.
 */
class EmailPreferencesController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json($request->user()->emailPreferences());
    }

    public function update(UpdateEmailPreferencesRequest $request): JsonResponse
    {
        $user = $request->user();
        $changes = collect($request->validated())->map(fn (mixed $on) => (bool) $on)->all();

        $user->update(['email_preferences' => array_merge($user->emailPreferences(), $changes)]);

        return response()->json($user->emailPreferences());
    }
}
