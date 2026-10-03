<?php

namespace App\Http\Controllers\Group;

use App\Actions\Groups\VerifyDraw;
use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\SecretSantaAssignment;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

/**
 * Lets the owner confirm the draw is sound: a spoiler-free check, and (separately, since
 * it spoils who drew them) the full list of pairs.
 */
class DrawDetailsController extends Controller
{
    public function check(VerifyDraw $action, Group $group): JsonResponse
    {
        $this->authorizeDrawn($group);

        return response()->json($action($group));
    }

    public function assignments(Group $group): JsonResponse
    {
        $this->authorizeDrawn($group);

        $pairs = $group->currentAssignments()->with('giver', 'receiver')->get()
            ->map(fn (SecretSantaAssignment $assignment) => [
                'giver' => ['id' => $assignment->giver->id, 'name' => $assignment->giver->name],
                'receiver' => ['id' => $assignment->receiver->id, 'name' => $assignment->receiver->name],
            ])
            ->sortBy('giver.name', SORT_NATURAL | SORT_FLAG_CASE)
            ->values();

        return response()->json($pairs);
    }

    private function authorizeDrawn(Group $group): void
    {
        $this->authorize('viewDraw', $group);

        if (! $group->is_drawn) {
            throw ValidationException::withMessages([
                'group' => ["Names haven't been drawn yet."],
            ]);
        }
    }
}
