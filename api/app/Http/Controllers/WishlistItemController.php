<?php

namespace App\Http\Controllers;

use App\Actions\Wishlist\NotifySuggesterOfChange;
use App\Events\WishlistChanged;
use App\Http\Requests\Wishlist\WishlistItemRequest;
use App\Http\Resources\WishlistItemResource;
use App\Models\User;
use App\Models\WishlistItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/**
 * The signed-in user's own wishlist, or a kid's or pet's they manage (?owner= / owner_id).
 * Update and destroy also serve suggestions on other people's lists; the policy decides who
 * may change which.
 */
class WishlistItemController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(WishlistItem::class, 'item');
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        // Active items most-wanted first, then received ("Got it") ones, newest first. A managed
        // list comes with its claims (the resource adds them for anyone but the owner).
        $items = $this->listOwner($request, $request->integer('owner'))->wishlistItems()
            ->with('claims.user')
            ->orderByRaw('received_at is not null')
            ->orderByDesc('received_at')
            ->mostWantedFirst()
            ->get();

        return WishlistItemResource::collection($items);
    }

    public function store(WishlistItemRequest $request): WishlistItemResource
    {
        $item = $this->listOwner($request, $request->integer('owner_id'))
            ->wishlistItems()
            ->create($request->safe()->except('owner_id'));

        WishlistChanged::dispatch($item->user_id);

        return new WishlistItemResource($item);
    }

    /**
     * Whose list: the signed-in user's, or (given an id) a kid or pet they manage.
     */
    private function listOwner(Request $request, int $ownerId): User
    {
        $user = $request->user();
        $owner = $ownerId === 0 || $ownerId === $user->id ? $user : User::findOrFail($ownerId);

        $this->authorize('keepWishlist', $owner);

        return $owner;
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
