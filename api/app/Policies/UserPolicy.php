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
        return $viewer->is($owner) || $viewer->sharesGroupWith($owner);
    }
}
