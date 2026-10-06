<?php

namespace App\Http\Controllers\Group;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * What an invite link (/join/CODE) is for, shown before joining and before signing in: the
 * group's name, its owner and size. Anyone holding the code could join anyway, so this
 * reveals no more than the code does; it's rate-limited like joining.
 */
class InvitePreviewHandler extends Controller
{
    public function __invoke(Request $request, string $code): JsonResponse
    {
        $group = Group::where('join_code', Str::upper($code))->with('owner')->withCount('members')->first();

        abort_if($group === null, 404, 'This invite link is no longer valid. Ask the group owner for a new one.');

        // Signed in already? Then the page can skip straight to "you're already in this group".
        $viewer = $request->user('sanctum');

        return response()->json([
            'group_name' => $group->name,
            'owner_name' => $group->owner->name,
            'members_count' => $group->members_count,
            'is_drawn' => $group->is_drawn,
            'already_member' => $viewer instanceof User && $group->members()->whereKey($viewer->id)->exists(),
        ]);
    }
}
