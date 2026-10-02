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

        $item->forceFill(['claimed_by_id' => null, 'claimed_at' => null])->save();

        WishlistChanged::dispatch($item->user_id);

        return new WishlistItemResource($item);
    }
}
