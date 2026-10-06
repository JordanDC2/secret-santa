<?php

namespace App\Http\Resources;

use App\Models\Group;
use App\Models\User;
use App\Support\PersonNames;
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
        // First names, with a bit of the last name where two members share one.
        $names = PersonNames::among($this->members);

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
                'name' => $names[$member->id],
                // "child" or "pet" for a managed profile, so the card can mark it.
                'kind' => $member->managed_kind,
                'managed_by_me' => $viewer->manages($member),
                // False when the owner has them sitting this draw out.
                'in_draw' => (bool) ($member->pivot->in_draw ?? true),
            ])->values(),
            'is_drawn' => $this->is_drawn,
            // Lets the draw confirmation offer "avoid last draw's matches".
            'has_previous_draw' => $this->draw_number > 1,
            // Only the owner learns about exclusions, not even how many there are.
            'exclusions_count' => $this->when($this->owner_id === $request->user()->id, fn () => $this->exclusions()->count()),
            'my_assignment' => $myAssignment ? [
                'recipient_id' => $myAssignment->receiver->id,
                // In full, so there's no doubt who to shop for.
                'recipient_name' => $myAssignment->receiver->full_name,
                'unread_messages' => $myAssignment->unreadCountFor(viewerIsSanta: true),
            ] : null,
            'my_santa' => $mySantasAssignment ? [
                'unread_messages' => $mySantasAssignment->unreadCountFor(viewerIsSanta: false),
            ] : null,
            // The same, for each kid or pet the viewer looks after in this group: who they drew,
            // and their two Santa chats (never who their Santa is).
            'managed_assignments' => $this->is_drawn ? $this->managedAssignments($viewer, $names) : [],
        ];
    }

    /**
     * @param  array<int, string>  $names  Members' names as the group shows them.
     * @return array<int, array{
     *     profile: array{id: int, name: string, kind: string|null},
     *     recipient: array{id: int, name: string, unread_messages: int}|null,
     *     santa: array{unread_messages: int}|null,
     * }>
     */
    private function managedAssignments(User $viewer, array $names): array
    {
        $rows = $this->members
            ->filter(fn (User $member) => $viewer->manages($member))
            ->map(fn (User $profile) => $this->managedAssignment($profile, $names[$profile->id]))
            ->values()
            ->all();

        // Anyone with unread messages first, so the badge's chat is easy to find; then A to Z.
        usort($rows, fn ($a, $b) => ($this->unreadIn($b) > 0) <=> ($this->unreadIn($a) > 0)
            ?: strcasecmp($a['profile']['name'], $b['profile']['name']));

        return $rows;
    }

    /**
     * @return array{
     *     profile: array{id: int, name: string, kind: string|null},
     *     recipient: array{id: int, name: string, unread_messages: int}|null,
     *     santa: array{unread_messages: int}|null,
     * }
     */
    private function managedAssignment(User $profile, string $name): array
    {
        $theirAssignment = $this->assignmentFor($profile);
        $theirSantasAssignment = $this->assignmentOfSantaFor($profile);

        return [
            'profile' => ['id' => $profile->id, 'name' => $name, 'kind' => $profile->managed_kind],
            'recipient' => $theirAssignment ? [
                'id' => $theirAssignment->receiver->id,
                'name' => $theirAssignment->receiver->full_name,
                'unread_messages' => $theirAssignment->unreadCountFor(viewerIsSanta: true),
            ] : null,
            'santa' => $theirSantasAssignment ? [
                'unread_messages' => $theirSantasAssignment->unreadCountFor(viewerIsSanta: false),
            ] : null,
        ];
    }

    /**
     * @param  array{recipient: array{unread_messages: int}|null, santa: array{unread_messages: int}|null}  $managed
     */
    private function unreadIn(array $managed): int
    {
        return ($managed['recipient']['unread_messages'] ?? 0) + ($managed['santa']['unread_messages'] ?? 0);
    }
}
