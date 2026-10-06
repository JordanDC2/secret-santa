<?php

namespace App\Actions\Groups;

use App\Models\Group;
use App\Models\GroupExclusion;
use Illuminate\Validation\ValidationException;

class AddExclusion
{
    public function __construct(
        private readonly GenerateAssignments $generateAssignments
    ) {}

    public function __invoke(Group $group, int $giverId, int $receiverId, bool $mutual): GroupExclusion
    {
        if ($group->is_drawn) {
            throw ValidationException::withMessages([
                'group' => ['Names have already been drawn, so exclusions can no longer change.'],
            ]);
        }

        // Only people in the draw: an exclusion with someone sitting it out would do nothing.
        $memberIds = $group->drawMembers()->pluck('users.id')->all();

        if (! in_array($giverId, $memberIds, true) || ! in_array($receiverId, $memberIds, true)) {
            throw ValidationException::withMessages([
                'giver_id' => ['Both people need to be in the draw.'],
            ]);
        }

        $alreadyExcluded = $group->exclusions()
            ->where(fn ($query) => $query
                ->where(fn ($pair) => $pair->where('giver_id', $giverId)->where('receiver_id', $receiverId))
                ->orWhere(fn ($pair) => $pair->where('giver_id', $receiverId)->where('receiver_id', $giverId)))
            ->exists();

        if ($alreadyExcluded) {
            throw ValidationException::withMessages([
                'giver_id' => ['There is already an exclusion between these two. Remove it first to change it.'],
            ]);
        }

        $exclusion = new GroupExclusion(['giver_id' => $giverId, 'receiver_id' => $receiverId, 'mutual' => $mutual]);
        $blockedPairs = [...$group->blockedPairsAmong($memberIds), ...$exclusion->blockedPairs()];

        if (($this->generateAssignments)($memberIds, $blockedPairs) === null) {
            throw ValidationException::withMessages([
                'giver_id' => ['With this exclusion there would be no way to match everyone.'],
            ]);
        }

        $group->exclusions()->save($exclusion);

        return $exclusion->load('giver', 'receiver');
    }
}
