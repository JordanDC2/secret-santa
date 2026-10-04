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

    /**
     * Owners manage their own items. Suggestions are the reverse: anyone who can see the
     * list may edit or remove them, except the owner, who must never know they exist.
     */
    public function update(User $user, WishlistItem $item): bool
    {
        return $item->is_suggestion
            ? $user->id !== $item->user_id && $user->sharesGroupWith($item->owner)
            : $user->id === $item->user_id;
    }

    public function delete(User $user, WishlistItem $item): bool
    {
        return $this->update($user, $item);
    }

    /**
     * Only the owner says they got something, and only for their own items: suggestions
     * are invisible to them.
     */
    public function markReceived(User $user, WishlistItem $item): bool
    {
        return $user->id === $item->user_id && ! $item->is_suggestion;
    }

    /**
     * Anyone sharing a group with the owner can claim, except the owner, who must
     * never learn what's been claimed.
     */
    public function claim(User $user, WishlistItem $item): bool
    {
        return $user->id !== $item->user_id && $user->sharesGroupWith($item->owner);
    }

    /**
     * Only the person who claimed it can say they bought it.
     */
    public function markPurchased(User $user, WishlistItem $item): bool
    {
        return $item->claims()->where('user_id', $user->id)->exists();
    }

    public function unclaim(User $user, WishlistItem $item): bool
    {
        return $item->claims()->where('user_id', $user->id)->exists();
    }
}
