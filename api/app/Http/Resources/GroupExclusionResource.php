<?php

namespace App\Http\Resources;

use App\Models\GroupExclusion;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin GroupExclusion
 */
class GroupExclusionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'giver' => ['id' => $this->giver->id, 'name' => $this->giver->name],
            'receiver' => ['id' => $this->receiver->id, 'name' => $this->receiver->name],
            'mutual' => $this->mutual,
        ];
    }
}
