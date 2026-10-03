<?php

namespace App\Actions\Groups;

use App\Events\GroupChanged;
use App\Models\Group;
use App\Notifications\SecretSantaAssigned;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DrawNames
{
    public function __construct(
        private readonly GenerateAssignments $generateAssignments
    ) {}

    public function __invoke(Group $group): Group
    {
        if ($group->is_drawn) {
            throw ValidationException::withMessages([
                'group' => ['Names have already been drawn for this group.'],
            ]);
        }

        $members = $group->members;

        if ($members->count() < 2) {
            throw ValidationException::withMessages([
                'group' => ['A group needs at least 2 members before names can be drawn.'],
            ]);
        }

        $memberIds = $members->pluck('id')->all();
        $assignments = ($this->generateAssignments)($memberIds, $group->blockedPairsAmong($memberIds));

        if ($assignments === null) {
            throw ValidationException::withMessages([
                'group' => ['These exclusions leave no way to match everyone. Remove one and try again.'],
            ]);
        }

        DB::transaction(function () use ($group, $assignments) {
            // Claim the draw with a single conditional update: if two requests race (say, a
            // double-click), only one can flip drawn_at, so assignments and emails happen once.
            $claimed = Group::whereKey($group->id)->whereNull('drawn_at')->update(['drawn_at' => now()]);

            if (! $claimed) {
                throw ValidationException::withMessages([
                    'group' => ['Names have already been drawn for this group.'],
                ]);
            }

            $group->assignments()->delete();

            foreach ($assignments as $giverId => $receiverId) {
                $group->assignments()->create([
                    'giver_id' => $giverId,
                    'receiver_id' => $receiverId,
                ]);
            }
        });

        GroupChanged::dispatch($group->id);

        foreach ($members as $giver) {
            $receiver = $members->firstWhere('id', $assignments[$giver->id]);

            $giver->notify(new SecretSantaAssigned($group, $receiver));
        }

        return $group->refresh();
    }
}
