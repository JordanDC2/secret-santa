<?php

namespace App\Http\Controllers\Group;

use App\Actions\Groups\AddExclusion;
use App\Http\Controllers\Controller;
use App\Http\Requests\Group\StoreExclusionRequest;
use App\Http\Resources\GroupExclusionResource;
use App\Models\Group;
use App\Models\GroupExclusion;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

/**
 * Who can't draw whom in a group. Owner only, and only before names are drawn.
 */
class ExclusionController extends Controller
{
    public function index(Group $group): AnonymousResourceCollection
    {
        $this->authorize('manageExclusions', $group);

        $exclusions = $group->exclusions()->with('giver', 'receiver')->oldest()->get();
        // Share the one group, so its members (for names) load once, not per exclusion.
        $exclusions->each(fn (GroupExclusion $exclusion) => $exclusion->setRelation('group', $group));

        return GroupExclusionResource::collection($exclusions);
    }

    public function store(AddExclusion $action, StoreExclusionRequest $request, Group $group): GroupExclusionResource
    {
        $this->authorize('manageExclusions', $group);

        return new GroupExclusionResource($action(
            $group,
            $request->integer('giver_id'),
            $request->integer('receiver_id'),
            $request->boolean('mutual'),
        ));
    }

    public function destroy(Group $group, GroupExclusion $exclusion): Response
    {
        $this->authorize('manageExclusions', $group);

        if ($group->is_drawn) {
            throw ValidationException::withMessages([
                'group' => ['Names have already been drawn, so exclusions can no longer change.'],
            ]);
        }

        $exclusion->delete();

        return response()->noContent();
    }
}
