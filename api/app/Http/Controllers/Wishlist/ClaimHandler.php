<?php

namespace App\Http\Controllers\Wishlist;

use App\Actions\Wishlist\ClaimWishlistItem;
use App\Events\WishlistChanged;
use App\Http\Controllers\Controller;
use App\Http\Resources\WishlistItemResource;
use App\Models\WishlistItem;
use Illuminate\Http\Request;

class ClaimHandler extends Controller
{
    public function __invoke(ClaimWishlistItem $action, Request $request, WishlistItem $item): WishlistItemResource
    {
        $this->authorize('claim', $item);

        $validated = $request->validate([
            'quantity' => ['sometimes', 'integer', 'between:1,99'],
        ]);

        $item = $action($request->user(), $item, $validated['quantity'] ?? 1);

        WishlistChanged::dispatch($item->user_id);

        return new WishlistItemResource($item);
    }
}
