<?php

namespace App\Http\Resources;

use App\Models\WishlistItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin WishlistItem
 */
class WishlistItemResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $viewer = $request->user();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'url' => $this->url,
            'image_url' => $this->image_url,
            'price' => $this->price,
            'notes' => $this->notes,
            'rating' => $this->rating,
            'quantity' => $this->quantity,
            // The owner never receives claim info, not even a "claimed" flag, so the
            // surprise can't leak through the browser's network tab.
            'claim' => $this->when($viewer->id !== $this->user_id, fn () => $this->claimSummary($viewer->id)),
        ];
    }

    /**
     * How much of the item is claimed, how much of that is the viewer's, and who has the
     * rest. A null name means that claimer isn't in any of the viewer's groups.
     *
     * @return array{claimed: int, mine: int, others: array<int, array{name: ?string, quantity: int}>}|null
     */
    private function claimSummary(int $viewerId): ?array
    {
        $claims = $this->relationLoaded('claims') ? $this->claims : $this->claims()->with('user')->get();

        if ($claims->isEmpty()) {
            return null;
        }

        return [
            'claimed' => (int) $claims->sum('quantity'),
            'mine' => (int) $claims->where('user_id', $viewerId)->sum('quantity'),
            'others' => $claims->where('user_id', '!=', $viewerId)
                ->map(fn ($claim) => ['name' => $claim->user?->name, 'quantity' => $claim->quantity])
                ->values()
                ->all(),
        ];
    }
}
