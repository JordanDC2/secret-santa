<?php

namespace App\Http\Controllers\Wishlist;

use App\Events\WishlistChanged;
use App\Http\Controllers\Controller;
use App\Http\Requests\Wishlist\WishlistItemRequest;
use App\Http\Resources\WishlistItemResource;
use App\Models\User;

/**
 * Adds a gift idea to someone else's list. Editing and removing suggestions go through the
 * usual item routes, where the policy lets anyone but the owner change them.
 */
class SuggestionHandler extends Controller
{
    public function __invoke(WishlistItemRequest $request, User $user): WishlistItemResource
    {
        $this->authorize('suggestFor', $user);

        $item = $user->suggestedItems()->create([
            ...$request->validated(),
            'is_suggestion' => true,
            'suggested_by_id' => $request->user()->id,
        ]);

        WishlistChanged::dispatch($user->id);

        return new WishlistItemResource($item);
    }
}
