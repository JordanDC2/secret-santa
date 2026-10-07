<?php

namespace App\Http\Controllers\Admin;

use App\Events\GroupChanged;
use App\Http\Controllers\Controller;
use App\Models\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

/**
 * Every group, for the admin page. Never the draw itself: only whether one has happened.
 */
class GroupController extends Controller
{
    public function index(): JsonResponse
    {
        $groups = Group::with('owner')
            ->withCount('members')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Group $group) => [
                'id' => $group->id,
                'name' => $group->name,
                'owner' => ['id' => $group->owner->id, 'name' => $group->owner->full_name, 'email' => $group->owner->email],
                'members_count' => $group->members_count,
                'is_drawn' => $group->drawn_at !== null,
                'draw_number' => $group->draw_number,
                'exchange_date' => $group->exchange_date?->toDateString(),
                'budget' => $group->budgetLabel(),
                'created_at' => $group->created_at?->toIso8601String(),
            ]);

        return response()->json($groups);
    }

    /**
     * Same as the owner deleting it: memberships and draws go with it.
     */
    public function destroy(Group $group): Response
    {
        $group->delete();

        GroupChanged::dispatch($group->id);

        return response()->noContent();
    }
}
