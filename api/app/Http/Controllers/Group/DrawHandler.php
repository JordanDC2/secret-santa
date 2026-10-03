<?php

namespace App\Http\Controllers\Group;

use App\Actions\Groups\DrawNames;
use App\Http\Controllers\Controller;
use App\Http\Resources\GroupResource;
use App\Models\Group;
use Illuminate\Http\Request;

class DrawHandler extends Controller
{
    public function __invoke(DrawNames $action, Request $request, Group $group): GroupResource
    {
        $this->authorize('draw', $group);

        $group = $action($group, $request->boolean('avoid_previous_matches', true));

        return new GroupResource($group->loadCount('members'));
    }
}
