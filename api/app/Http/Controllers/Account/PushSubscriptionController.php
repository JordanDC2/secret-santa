<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * "Allow notifications on this device": the browser hands us an address to push to (its push
 * service's endpoint and encryption keys), which we keep against the signed-in person.
 */
class PushSubscriptionController extends Controller
{
    public function store(Request $request): Response
    {
        $validated = $request->validate([
            // Push services are always https (Google, Mozilla, Apple, Microsoft).
            'endpoint' => ['required', 'url:https', 'max:500'],
            'keys.p256dh' => ['required', 'string', 'max:255'],
            'keys.auth' => ['required', 'string', 'max:255'],
            'content_encoding' => ['nullable', 'in:aesgcm,aes128gcm'],
        ]);

        // A device moving to another account (someone else signs in on it) moves with it.
        $request->user()->updatePushSubscription(
            $validated['endpoint'],
            $validated['keys']['p256dh'],
            $validated['keys']['auth'],
            $validated['content_encoding'] ?? 'aes128gcm',
        );

        return response()->noContent();
    }

    public function destroy(Request $request): Response
    {
        $validated = $request->validate(['endpoint' => ['required', 'string', 'max:500']]);

        $request->user()->deletePushSubscription($validated['endpoint']);

        return response()->noContent();
    }
}
