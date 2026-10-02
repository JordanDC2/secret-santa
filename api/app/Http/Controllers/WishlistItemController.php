<?php

namespace App\Http\Controllers;

use App\Http\Requests\Wishlist\WishlistItemRequest;
use App\Http\Resources\WishlistItemResource;
use App\Models\WishlistItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/**
 * The signed-in user's own wishlist.
 */
class WishlistItemController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(WishlistItem::class, 'item');
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        return WishlistItemResource::collection($request->user()->wishlistItems()->mostWantedFirst()->get());
    }

    public function store(WishlistItemRequest $request): WishlistItemResource
    {
        return new WishlistItemResource($request->user()->wishlistItems()->create($request->validated()));
    }

    public function update(WishlistItemRequest $request, WishlistItem $item): WishlistItemResource
    {
        $item->update($request->validated());

        return new WishlistItemResource($item);
    }

    public function destroy(WishlistItem $item): Response
    {
        $item->delete();

        return response()->noContent();
    }
}
