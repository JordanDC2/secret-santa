<?php

namespace App\Http\Controllers\Group;

use App\Actions\Groups\LeaveGroup;
use App\Http\Controllers\Controller;
use App\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class LeaveHandler extends Controller
{
    public function __invoke(LeaveGroup $action, Request $request, Group $group): Response
    {
        $this->authorize('leave', $group);

        $action($request->user(), $group);

        return response()->noContent();
    }
}
