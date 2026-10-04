<?php

namespace App\Http\Controllers\Wishlist;

use App\Events\WishlistChanged;
use App\Http\Controllers\Controller;
use App\Http\Resources\WishlistItemResource;
use App\Models\WishlistItem;
use Illuminate\Http\Request;

/**
 * "Got it": the owner marks an item received, which takes it off their list for everyone and
 * keeps it as history. Undoing it puts it back. Claims are left alone either way.
 */
class ReceivedHandler extends Controller
{
    public function store(Request $request, WishlistItem $item): WishlistItemResource
    {
        return $this->setReceived($item, now());
    }

    public function destroy(Request $request, WishlistItem $item): WishlistItemResource
    {
        return $this->setReceived($item, null);
    }

    private function setReceived(WishlistItem $item, mixed $receivedAt): WishlistItemResource
    {
        $this->authorize('markReceived', $item);

        $item->update(['received_at' => $receivedAt]);

        WishlistChanged::dispatch($item->user_id);

        return new WishlistItemResource($item);
    }
}
