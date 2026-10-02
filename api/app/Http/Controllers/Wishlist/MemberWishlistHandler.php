<?php

namespace App\Http\Controllers\Wishlist;

use App\Http\Controllers\Controller;
use App\Http\Resources\WishlistItemResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberWishlistHandler extends Controller
{
    public function __invoke(Request $request, User $user): JsonResponse
    {
        $this->authorize('viewWishlist', $user);

        $items = $user->wishlistItems()->with('claimedBy')->mostWantedFirst()->get();

        return response()->json([
            'user' => ['id' => $user->id, 'name' => $user->name],
            'items' => WishlistItemResource::collection($items),
            // Lets the page warn when you're about to claim a gift for someone who
            // isn't your Secret Santa person.
            'my_recipients' => $request->user()->secretSantaRecipients()
                ->map(fn (User $recipient) => ['id' => $recipient->id, 'name' => $recipient->name])
                ->values(),
        ]);
    }
}
