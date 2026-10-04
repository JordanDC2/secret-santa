<?php

namespace App\Http\Controllers;

use App\Actions\Wishlist\NotifySuggesterOfChange;
use App\Events\WishlistChanged;
use App\Http\Requests\Wishlist\WishlistItemRequest;
use App\Http\Resources\WishlistItemResource;
use App\Models\WishlistItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/**
 * The signed-in user's own wishlist. Update and destroy also serve suggestions on other
 * people's lists; the policy decides who may change which.
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
        $item = $request->user()->wishlistItems()->create($request->validated());

        WishlistChanged::dispatch($item->user_id);

        return new WishlistItemResource($item);
    }

    public function update(WishlistItemRequest $request, WishlistItem $item, NotifySuggesterOfChange $notifySuggester): WishlistItemResource
    {
        $item->fill($request->validated());
        $changes = collect($item->getDirty())
            ->mapWithKeys(fn (mixed $after, string $field) => [$field => [$item->getOriginal($field), $after]])
            ->all();
        $item->save();

        $notifySuggester($item, $request->user(), $changes);

        WishlistChanged::dispatch($item->user_id);

        return new WishlistItemResource($item);
    }

    public function destroy(Request $request, WishlistItem $item, NotifySuggesterOfChange $notifySuggester): Response
    {
        $notifySuggester($item, $request->user(), [], removed: true);

        $item->delete();

        WishlistChanged::dispatch($item->user_id);

        return response()->noContent();
    }
}
