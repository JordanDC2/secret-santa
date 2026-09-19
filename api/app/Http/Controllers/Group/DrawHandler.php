<?php

namespace App\Http\Controllers\Group;

use App\Actions\Groups\DrawNames;
use App\Http\Controllers\Controller;
use App\Http\Resources\GroupResource;
use App\Models\Group;

class DrawHandler extends Controller
{
    public function __invoke(DrawNames $action, Group $group): GroupResource
    {
        $this->authorize('draw', $group);

        $group = $action($group);

        return new GroupResource($group->loadCount('members'));
    }
}
