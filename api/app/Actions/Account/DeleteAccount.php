<?php

namespace App\Actions\Account;

use App\Events\GroupChanged;
use App\Events\WishlistChanged;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DeleteAccount
{
    /**
     * Deletes the user and every group they own. The database cascades the rest
     * (memberships, assignments, wishlist items) and clears claims they made.
     */
    public function __invoke(User $user): void
    {
        $affectedGroupIds = $user->groups()->pluck('groups.id');
        $claimedFromOwnerIds = $user->claimedWishlistItems()->distinct()->pluck('user_id');

        DB::transaction(function () use ($user) {
            $user->ownedGroups()->delete();
            $user->tokens()->delete();
            $user->delete();
        });

        // Groups they owned are gone and groups they were in lost a member; lists they
        // claimed from now show those gifts as available again.
        $affectedGroupIds->each(fn (int $groupId) => GroupChanged::dispatch($groupId));
        $claimedFromOwnerIds->each(fn (int $ownerId) => WishlistChanged::dispatch($ownerId));
    }
}
