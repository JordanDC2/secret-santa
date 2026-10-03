<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WishlistItem;

class WishlistItemPolicy
{
    /**
     * Everyone can list their own wishlist.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, WishlistItem $item): bool
    {
        return $user->id === $item->user_id;
    }

    public function delete(User $user, WishlistItem $item): bool
    {
        return $user->id === $item->user_id;
    }

    /**
     * Anyone sharing a group with the owner can claim, except the owner, who must
     * never learn what's been claimed.
     */
    public function claim(User $user, WishlistItem $item): bool
    {
        return $user->id !== $item->user_id && $user->sharesGroupWith($item->owner);
    }

    public function unclaim(User $user, WishlistItem $item): bool
    {
        return $item->claims()->where('user_id', $user->id)->exists();
    }
}
