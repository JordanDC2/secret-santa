<?php

namespace App\Actions\Wishlist;

use App\Models\User;
use App\Models\WishlistItem;
use Illuminate\Validation\ValidationException;

class ClaimWishlistItem
{
    public function __invoke(User $user, WishlistItem $item): WishlistItem
    {
        // A single conditional update, so two people claiming at the same moment
        // can't both succeed.
        $claimed = WishlistItem::whereKey($item->id)
            ->whereNull('claimed_by_id')
            ->update(['claimed_by_id' => $user->id, 'claimed_at' => now()]);

        if (! $claimed) {
            throw ValidationException::withMessages([
                'item' => ['Someone has already claimed this gift.'],
            ]);
        }

        return $item->refresh()->load('claimedBy');
    }
}
