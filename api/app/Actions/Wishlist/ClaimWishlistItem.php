<?php

namespace App\Actions\Wishlist;

use App\Models\User;
use App\Models\WishlistItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ClaimWishlistItem
{
    /**
     * Claims some of an item for this user, adding to anything they already claimed.
     */
    public function __invoke(User $user, WishlistItem $item, int $quantity = 1): WishlistItem
    {
        DB::transaction(function () use ($user, $item, $quantity) {
            // Take the item's write lock before counting, so two people grabbing the last
            // one at the same moment can't both get it. lockForUpdate covers databases with
            // row locks; the no-op update makes SQLite hold its write lock from here on.
            WishlistItem::whereKey($item->id)->lockForUpdate()->update(['quantity' => DB::raw('quantity')]);

            $fresh = WishlistItem::with('claims')->findOrFail($item->id);

            if ($fresh->received_at !== null) {
                throw ValidationException::withMessages(['item' => ['They already got this one.']]);
            }

            $remaining = $fresh->remainingQuantity();

            if ($remaining === 0) {
                throw ValidationException::withMessages(['item' => ['Someone has already claimed this gift.']]);
            }

            if ($quantity > $remaining) {
                throw ValidationException::withMessages(['quantity' => ["Only {$remaining} left to claim."]]);
            }

            $mine = $fresh->claims->firstWhere('user_id', $user->id);

            if ($mine) {
                // Claiming more means some of it isn't bought yet: mark it bought again once it is.
                $mine->update(['quantity' => $mine->quantity + $quantity, 'purchased_at' => null]);
            } else {
                $fresh->claims()->create(['user_id' => $user->id, 'quantity' => $quantity, 'claimed_at' => now()]);
            }
        });

        return $item->refresh()->load('claims.user');
    }
}
