<?php

namespace App\Http\Controllers\Group;

use App\Events\GroupChanged;
use App\Http\Controllers\Controller;
use App\Http\Resources\GroupResource;
use App\Models\Group;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * The owner puts a member in or out of the draw (before names are drawn). Out means they stay
 * in the group, seeing and shopping everyone's lists, but aren't drawn.
 */
class DrawParticipantHandler extends Controller
{
    public function __invoke(Request $request, Group $group, User $member): GroupResource
    {
        $this->authorize('chooseDrawMembers', $group);
        $request->validate(['in_draw' => ['required', 'boolean']]);
        abort_unless($group->members()->whereKey($member->id)->exists(), 404);

        if ($group->is_drawn) {
            throw ValidationException::withMessages([
                'in_draw' => ["Names have already been drawn. Start a new draw to change who's in it."],
            ]);
        }

        $group->members()->updateExistingPivot($member->id, ['in_draw' => $request->boolean('in_draw')]);

        GroupChanged::dispatch($group->id);

        return new GroupResource($group->load('members')->loadCount('members'));
    }
}
