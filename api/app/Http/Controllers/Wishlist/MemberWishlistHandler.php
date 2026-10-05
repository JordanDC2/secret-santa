<?php

namespace App\Http\Controllers\Wishlist;

use App\Http\Controllers\Controller;
use App\Http\Resources\WishlistItemResource;
use App\Models\SecretSantaAssignment;
use App\Models\User;
use App\Models\WishlistClaim;
use App\Models\WishlistItem;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberWishlistHandler extends Controller
{
    public function __invoke(Request $request, User $user): JsonResponse
    {
        $this->authorize('viewWishlist', $user);
        $today = now(config('app.reminder_timezone'))->startOfDay();

        // Items the owner marked "Got it" are history, not part of the list.
        $items = $user->wishlistItems()->whereNull('received_at')->with('claims.user')->mostWantedFirst()->get();
        // Gift ideas others added, oldest first. Never for the owner: this route also serves
        // their own list, and suggestions are a surprise.
        $suggestions = $request->user()->is($user)
            ? new Collection
            : $user->suggestedItems()->with('claims.user', 'suggestedBy')->oldest('id')->get();

        // Only name claimers you share a group with; anyone else shows as "someone",
        // so a list doesn't leak who's in groups you aren't part of.
        $groupMateIds = $request->user()->groupMateIds();
        $items->concat($suggestions)->each(fn (WishlistItem $item) => $item->claims->each(function (WishlistClaim $claim) use ($groupMateIds) {
            if (! in_array($claim->user_id, $groupMateIds, true)) {
                $claim->setRelation('user', null);
            }
        }));

        return response()->json([
            'user' => ['id' => $user->id, 'name' => $user->name],
            'items' => WishlistItemResource::collection($items),
            'suggestions' => WishlistItemResource::collection($suggestions),
            // Who you're buying for in each group's current draw, so the page can say "you drew
            // this person in <group>" or warn that they aren't your person. Groups whose exchange
            // has passed are left out: they may still be on last year's draw. Undated groups
            // stay, since there's no telling.
            'my_recipients' => $request->user()->secretSantaRecipients()
                ->reject(fn (SecretSantaAssignment $assignment) => $assignment->group->exchange_date?->lessThan($today) === true)
                ->map(fn (SecretSantaAssignment $assignment) => [
                    'id' => $assignment->receiver->id,
                    'name' => $assignment->receiver->name,
                    'group' => [
                        'id' => $assignment->group->id,
                        'name' => $assignment->group->name,
                        'exchange_date' => $assignment->group->exchange_date?->toDateString(),
                        'budget' => $assignment->group->budgetLabel(),
                    ],
                ])
                ->values(),
        ]);
    }
}
