<?php

namespace App\Http\Controllers\Group;

use App\Actions\Groups\StartNewDraw;
use App\Events\GroupChanged;
use App\Http\Controllers\Controller;
use App\Http\Resources\GroupResource;
use App\Models\Group;

class StartNewDrawHandler extends Controller
{
    public function __invoke(StartNewDraw $action, Group $group): GroupResource
    {
        $this->authorize('draw', $group);

        $group = $action($group);

        GroupChanged::dispatch($group->id);

        return new GroupResource($group->loadCount('members'));
    }
}
