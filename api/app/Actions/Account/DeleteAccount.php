<?php

namespace App\Actions\Account;

use App\Events\GroupChanged;
use App\Events\WishlistChanged;
use App\Models\User;
use App\Models\WishlistItem;
use Illuminate\Support\Facades\DB;

class DeleteAccount
{
    /**
     * Deletes the user and every group they own. The database cascades the rest
     * (memberships, assignments, wishlist items) and clears claims they made. Kids and pets
     * only they look after go too (nobody would be left to look after them); ones with
     * another parent stay with them.
     */
    public function __invoke(User $user): void
    {
        $user->managedProfiles()
            ->whereDoesntHave('managers', fn ($managers) => $managers->whereKeyNot($user->id))
            ->get()
            ->each(fn (User $profile) => $this($profile));

        $affectedGroupIds = $user->groups()->pluck('groups.id');
        // Lists that change: ones they claimed from, and ones they suggested gifts for (those
        // suggestions stay, now "suggested by someone").
        $changedListOwnerIds = WishlistItem::where(fn ($items) => $items
            ->whereHas('claims', fn ($claims) => $claims->where('user_id', $user->id))
            ->orWhere('suggested_by_id', $user->id))
            ->distinct()
            ->pluck('user_id');

        DB::transaction(function () use ($user) {
            $user->ownedGroups()->delete();
            $user->tokens()->delete();
            $user->endOtherSessions();
            $user->delete();
        });

        // Groups they owned are gone and groups they were in lost a member; lists they
        // claimed from show those gifts as available again.
        $affectedGroupIds->each(fn (int $groupId) => GroupChanged::dispatch($groupId));
        $changedListOwnerIds->each(fn (int $ownerId) => WishlistChanged::dispatch($ownerId));
    }
}
