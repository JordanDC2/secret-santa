<?php

namespace App\Http\Controllers\Wishlist;

use App\Events\WishlistChanged;
use App\Http\Controllers\Controller;
use App\Models\WishlistClaim;
use App\Notifications\ClaimNudged;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

/**
 * Claims never lapse, so when a claimed gift seems forgotten, a fellow shopper can nudge the
 * claimer by email to mark it bought or drop it. At most once per claim every few days.
 */
class NudgeClaimHandler extends Controller
{
    public const COOLDOWN_DAYS = 3;

    public function __invoke(Request $request, WishlistClaim $claim): Response
    {
        $this->authorize('nudge', $claim);

        if ($claim->nudged_at !== null && $claim->nudged_at->greaterThan(now()->subDays(self::COOLDOWN_DAYS))) {
            throw ValidationException::withMessages([
                'claim' => ['They were nudged recently. You can nudge again '.$claim->nudged_at->addDays(self::COOLDOWN_DAYS)->diffForHumans().'.'],
            ]);
        }

        $claim->update(['nudged_at' => now()]);

        $item = $claim->item;
        $claimer = $claim->user;
        $nudger = $request->user();

        $claimer->notify(new ClaimNudged(
            ownerId: $item->user_id,
            ownerName: $item->owner->name,
            itemName: $item->name,
            claimedAt: $claim->claimed_at?->format('F Y'),
            // Same rule as everywhere: only name people the claimer shares a group with.
            nudgerName: $claimer->sharesGroupWith($nudger) ? $nudger->name : null,
        ));

        WishlistChanged::dispatch($item->user_id);

        return response()->noContent();
    }
}
