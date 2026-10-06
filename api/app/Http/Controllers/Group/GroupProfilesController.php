<?php

namespace App\Http\Controllers\Group;

use App\Actions\Groups\LeaveGroup;
use App\Actions\ManagedProfiles\AddProfileToGroup;
use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Adding the kids and pets you look after to a group you're in, and taking them out again
 * (before names are drawn, like joining and leaving).
 */
class GroupProfilesController extends Controller
{
    public function store(Request $request, Group $group, AddProfileToGroup $add): Response
    {
        $request->validate(['profile_id' => ['required', 'integer']]);
        $profile = User::findOrFail($request->integer('profile_id'));
        $this->authorize('view', $group);
        $this->authorize('manage', $profile);

        $add($profile, $group);

        return response()->noContent();
    }

    public function destroy(Group $group, User $profile, LeaveGroup $leave): Response
    {
        $this->authorize('view', $group);
        $this->authorize('manage', $profile);
        abort_unless($group->members()->whereKey($profile->id)->exists(), 404);

        $leave($profile, $group);

        return response()->noContent();
    }
}
