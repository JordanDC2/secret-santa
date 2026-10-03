<?php

namespace App\Http\Controllers\Wishlist;

use App\Events\WishlistChanged;
use App\Http\Controllers\Controller;
use App\Http\Resources\WishlistItemResource;
use App\Models\WishlistItem;

class UnclaimHandler extends Controller
{
    public function __invoke(WishlistItem $item): WishlistItemResource
    {
        $this->authorize('unclaim', $item);

        // Undo removes this person's whole claim on the item; others' claims stay.
        $item->claims()->where('user_id', request()->user()->id)->delete();
        $item->load('claims.user');

        WishlistChanged::dispatch($item->user_id);

        return new WishlistItemResource($item);
    }
}
