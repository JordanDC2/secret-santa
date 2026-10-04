<?php

namespace App\Http\Resources;

use App\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Group
 */
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
        // Never send this assignment's giver: it's the viewer's own Secret Santa.
        $mySantasAssignment = $this->assignmentOfSantaFor($request->user());

        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'join_code' => $this->join_code,
            'is_owner' => $this->owner_id === $request->user()->id,
            'members_count' => $this->members_count,
            'members' => $this->members->map(fn ($member) => [
                'id' => $member->id,
                'name' => $member->name,
            ])->values(),
            'is_drawn' => $this->is_drawn,
            // Lets the draw confirmation offer "avoid last draw's matches".
            'has_previous_draw' => $this->draw_number > 1,
            // Only the owner learns about exclusions, not even how many there are.
            'exclusions_count' => $this->when($this->owner_id === $request->user()->id, fn () => $this->exclusions()->count()),
            'my_assignment' => $myAssignment ? [
                'recipient_id' => $myAssignment->receiver->id,
                'recipient_name' => $myAssignment->receiver->name,
                'unread_messages' => $myAssignment->unreadCountFor(viewerIsSanta: true),
            ] : null,
            'my_santa' => $mySantasAssignment ? [
                'unread_messages' => $mySantasAssignment->unreadCountFor(viewerIsSanta: false),
            ] : null,
        ];
    }
}
