<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

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
            // The owner never receives claim info, not even a "claimed" flag, so the
            // surprise can't leak through the browser's network tab.
            'claim' => $this->when($viewer->id !== $this->user_id, fn () => $this->claimed_by_id ? [
                'claimed_by_me' => $this->claimed_by_id === $viewer->id,
                // Null when the claimer isn't in any of the viewer's groups (see MemberWishlistHandler).
                'claimed_by_name' => $this->claimedBy?->name,
            ] : null),
        ];
    }
}
