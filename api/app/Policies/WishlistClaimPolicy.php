<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WishlistClaim;

class WishlistClaimPolicy
{
    /**
     * Fellow shoppers can nudge someone about a gift they claimed but haven't marked bought.
     * Never the list's owner (they don't know what's claimed) or the claimer themselves.
     */
    public function nudge(User $user, WishlistClaim $claim): bool
    {
        $item = $claim->item;

        return $claim->purchased_at === null
            && $item->received_at === null
            && $user->id !== $claim->user_id
            && $user->id !== $item->user_id
            && $user->sharesGroupWith($item->owner);
    }
}
