<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GroupResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $myAssignment = $this->assignmentFor($request->user());

        return [
            'id' => $this->id,
            'name' => $this->name,
            'join_code' => $this->join_code,
            'is_owner' => $this->owner_id === $request->user()->id,
            'members_count' => $this->members_count,
            'is_drawn' => $this->is_drawn,
            'my_assignment' => $myAssignment ? [
                'recipient_name' => $myAssignment->receiver->name,
            ] : null,
        ];
    }
}
