<?php

namespace App\Http\Controllers\Group;

use App\Events\GroupChanged;
use App\Http\Controllers\Controller;
use App\Http\Resources\GroupResource;
use App\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * The owner's shortcut: everyone in the draw, or no one (then switch a few back on), before
 * names are drawn.
 */
class DrawEveryoneHandler extends Controller
{
    public function __invoke(Request $request, Group $group): GroupResource
    {
        $this->authorize('chooseDrawMembers', $group);
        $request->validate(['in_draw' => ['required', 'boolean']]);

        if ($group->is_drawn) {
            throw ValidationException::withMessages([
                'in_draw' => ["Names have already been drawn. Start a new draw to change who's in it."],
            ]);
        }

        DB::table('group_user')->where('group_id', $group->id)->update(['in_draw' => $request->boolean('in_draw')]);

        GroupChanged::dispatch($group->id);

        return new GroupResource($group->load('members')->loadCount('members'));
    }
}
