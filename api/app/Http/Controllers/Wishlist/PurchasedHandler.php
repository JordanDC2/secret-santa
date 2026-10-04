<?php

namespace App\Http\Controllers\Wishlist;

use App\Events\WishlistChanged;
use App\Http\Controllers\Controller;
use App\Http\Resources\WishlistItemResource;
use App\Models\WishlistClaim;
use App\Models\WishlistItem;
use Illuminate\Http\Request;

/**
 * "Bought it": the claimer marks their whole claim purchased. Invisible to the list's owner.
 * "Not bought yet" undoes it, leaving a plain claim.
 */
class PurchasedHandler extends Controller
{
    public function store(Request $request, WishlistItem $item): WishlistItemResource
    {
        $this->authorize('markPurchased', $item);

        $this->claimOf($request, $item)->update(['purchased_at' => now()]);

        return $this->respond($item);
    }

    public function destroy(Request $request, WishlistItem $item): WishlistItemResource
    {
        $this->authorize('markPurchased', $item);

        $this->claimOf($request, $item)->update(['purchased_at' => null]);

        return $this->respond($item);
    }

    private function claimOf(Request $request, WishlistItem $item): WishlistClaim
    {
        return $item->claims()->where('user_id', $request->user()->id)->firstOrFail();
    }

    private function respond(WishlistItem $item): WishlistItemResource
    {
        WishlistChanged::dispatch($item->user_id);

        return new WishlistItemResource($item->load('claims.user'));
    }
}
