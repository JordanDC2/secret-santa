<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    /**
     * Wishlists are visible to their owner and anyone who shares a group with them.
     */
    public function viewWishlist(User $viewer, User $owner): bool
    {
        return $viewer->actsFor($owner) || $viewer->sharesGroupWith($owner);
    }

    /**
     * Only a managed profile's managers rename it, remove it, or keep its wishlist.
     */
    public function manage(User $viewer, User $profile): bool
    {
        return $profile->isManagedProfile() && $viewer->manages($profile);
    }

    /**
     * Adding, editing and removing someone's own wishlist items: themselves, or whoever
     * manages them.
     */
    public function keepWishlist(User $viewer, User $owner): bool
    {
        return $viewer->actsFor($owner);
    }

    /**
     * Gift ideas for someone's list come from people who share a group with them, never
     * from the person themselves.
     */
    public function suggestFor(User $viewer, User $owner): bool
    {
        return ! $viewer->is($owner) && ($viewer->sharesGroupWith($owner) || $viewer->manages($owner));
    }

    /**
     * Live wishlist updates include claims, so the owner is deliberately left out. A managed
     * profile's managers do get them: they see what's been claimed for their kid or pet.
     */
    public function receiveWishlistUpdates(User $viewer, User $owner): bool
    {
        return ! $viewer->is($owner) && ($viewer->sharesGroupWith($owner) || $viewer->manages($owner));
    }
}
