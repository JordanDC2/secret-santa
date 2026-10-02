<?php

namespace App\Http\Controllers;

use App\Actions\Groups\CreateGroup;
use App\Events\GroupChanged;
use App\Http\Requests\Group\CreateRequest;
use App\Http\Resources\GroupResource;
use App\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class GroupController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Group::class);
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $groups = $request->user()->groups()->with('members')->withCount('members')->get();

        return GroupResource::collection($groups);
    }

    public function store(CreateGroup $action, CreateRequest $request): GroupResource
    {
        $group = $action($request->user(), $request->string('name')->value());

        return new GroupResource($group->loadCount('members'));
    }

    public function show(Group $group): GroupResource
    {
        return new GroupResource($group->loadCount('members'));
    }

    public function destroy(Group $group): Response
    {
        // Memberships and assignments cascade at the database level.
        $group->delete();

        GroupChanged::dispatch($group->id);

        return response()->noContent();
    }
}
