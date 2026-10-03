<?php

namespace App\Http\Controllers\Wishlist;

use App\Http\Controllers\Controller;
use App\Http\Resources\WishlistItemResource;
use App\Models\SecretSantaAssignment;
use App\Models\User;
use App\Models\WishlistItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberWishlistHandler extends Controller
{
    public function __invoke(Request $request, User $user): JsonResponse
    {
        $this->authorize('viewWishlist', $user);

        $items = $user->wishlistItems()->with('claimedBy')->mostWantedFirst()->get();

        // Only name claimers you share a group with; anyone else shows as "someone",
        // so a list doesn't leak who's in groups you aren't part of.
        $groupMateIds = $request->user()->groupMateIds();
        $items->each(function (WishlistItem $item) use ($groupMateIds) {
            if ($item->claimed_by_id && ! in_array($item->claimed_by_id, $groupMateIds, true)) {
                $item->setRelation('claimedBy', null);
            }
        });

        return response()->json([
            'user' => ['id' => $user->id, 'name' => $user->name],
            'items' => WishlistItemResource::collection($items),
            // Who you're buying for in each group's current draw, so the page can say "you drew
            // this person in <group>" or warn that they aren't your person.
            'my_recipients' => $request->user()->secretSantaRecipients()
                ->map(fn (SecretSantaAssignment $assignment) => [
                    'id' => $assignment->receiver->id,
                    'name' => $assignment->receiver->name,
                    'group' => ['id' => $assignment->group->id, 'name' => $assignment->group->name],
                ])
                ->values(),
        ]);
    }
}
