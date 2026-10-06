<?php

namespace App\Http\Resources;

use App\Models\Group;
use App\Models\User;
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
        $viewer = $request->user();
        $myAssignment = $this->assignmentFor($viewer);
        // Never send this assignment's giver: it's the viewer's own Secret Santa.
        $mySantasAssignment = $this->assignmentOfSantaFor($request->user());

        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'exchange_date' => $this->exchange_date?->toDateString(),
            'budget' => $this->budget_max === null ? null : ['min' => $this->budget_min, 'max' => $this->budget_max],
            'join_code' => $this->join_code,
            'is_owner' => $this->owner_id === $request->user()->id,
            'members_count' => $this->members_count,
            'members' => $this->members->map(fn (User $member) => [
                'id' => $member->id,
                'name' => $member->name,
                // "child" or "pet" for a managed profile, so the card can mark it.
                'kind' => $member->managed_kind,
                'managed_by_me' => $viewer->manages($member),
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
            // The same, for each kid or pet the viewer looks after in this group: who they drew,
            // and their two Santa chats (never who their Santa is).
            'managed_assignments' => $this->is_drawn ? $this->managedAssignments($viewer) : [],
        ];
    }

    /**
     * @return array<int, array{
     *     profile: array{id: int, name: string, kind: string|null},
     *     recipient: array{id: int, name: string, unread_messages: int}|null,
     *     santa: array{unread_messages: int}|null,
     * }>
     */
    private function managedAssignments(User $viewer): array
    {
        return $this->members
            ->filter(fn (User $member) => $viewer->manages($member))
            ->map(function (User $profile) {
                $theirAssignment = $this->assignmentFor($profile);
                $theirSantasAssignment = $this->assignmentOfSantaFor($profile);

                return [
                    'profile' => ['id' => $profile->id, 'name' => $profile->name, 'kind' => $profile->managed_kind],
                    'recipient' => $theirAssignment ? [
                        'id' => $theirAssignment->receiver->id,
                        'name' => $theirAssignment->receiver->name,
                        'unread_messages' => $theirAssignment->unreadCountFor(viewerIsSanta: true),
                    ] : null,
                    'santa' => $theirSantasAssignment ? [
                        'unread_messages' => $theirSantasAssignment->unreadCountFor(viewerIsSanta: false),
                    ] : null,
                ];
            })
            ->values()
            ->all();
    }
}
