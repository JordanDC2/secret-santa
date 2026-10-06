<?php

namespace App\Http\Resources;

use App\Models\GroupExclusion;
use App\Support\PersonNames;
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
        // As the group card names them.
        $names = PersonNames::forGroup($this->group);

        return [
            'id' => $this->id,
            'giver' => ['id' => $this->giver->id, 'name' => $names[$this->giver->id] ?? $this->giver->first_name],
            'receiver' => ['id' => $this->receiver->id, 'name' => $names[$this->receiver->id] ?? $this->receiver->first_name],
            'mutual' => $this->mutual,
        ];
    }
}
