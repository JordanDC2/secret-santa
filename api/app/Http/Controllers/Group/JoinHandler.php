<?php

namespace App\Http\Controllers\Group;

use App\Actions\Groups\JoinGroup;
use App\Http\Controllers\Controller;
use App\Http\Requests\Group\JoinRequest;
use App\Http\Resources\GroupResource;

class JoinHandler extends Controller
{
    public function __invoke(JoinGroup $action, JoinRequest $request): GroupResource
    {
        $group = $action($request->user(), $request->string('join_code')->value());

        return new GroupResource($group->loadCount('members'));
    }
}
