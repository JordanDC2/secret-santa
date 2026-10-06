<?php

namespace App\Http\Controllers\Account;

use App\Actions\Account\DeleteAccount;
use App\Actions\ManagedProfiles\AddCoParent;
use App\Actions\ManagedProfiles\CreateManagedProfile;
use App\Actions\ManagedProfiles\RemoveCoParent;
use App\Http\Controllers\Controller;
use App\Http\Requests\Account\ManagedProfileRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * The kids and pets the signed-in user looks after ("People I manage").
 */
class ManagedProfileController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $profiles = $request->user()->managedProfiles()->with('managers')->orderBy('name')->get();

        return response()->json($profiles->map(fn (User $profile) => $this->present($profile))->values());
    }

    public function store(ManagedProfileRequest $request, CreateManagedProfile $create): JsonResponse
    {
        $profile = $create($request->user(), $request->string('name')->value(), $request->string('kind')->value());

        return response()->json($this->present($profile), 201);
    }

    public function update(ManagedProfileRequest $request, User $profile): JsonResponse
    {
        $this->authorize('manage', $profile);

        $profile->update(['name' => $request->string('name')->value(), 'managed_kind' => $request->string('kind')->value()]);

        return response()->json($this->present($profile));
    }

    /**
     * Shares looking after a kid or pet with someone from your groups.
     */
    public function addManager(Request $request, User $profile, AddCoParent $add): JsonResponse
    {
        $this->authorize('manage', $profile);
        $request->validate(['user_id' => ['required', 'integer']]);

        $add($request->user(), $profile, User::findOrFail($request->integer('user_id')));

        return response()->json($this->present($profile));
    }

    /**
     * Stops someone (or yourself) looking after a kid or pet, as long as someone still does.
     */
    public function removeManager(User $profile, User $manager, RemoveCoParent $remove): Response
    {
        $this->authorize('manage', $profile);
        abort_unless($manager->manages($profile), 404);

        $remove($profile, $manager);

        return response()->noContent();
    }

    /**
     * Removes the profile and its wishlist, the same way deleting an account does.
     */
    public function destroy(Request $request, User $profile, DeleteAccount $delete): Response
    {
        $this->authorize('manage', $profile);

        $delete($profile);

        return response()->noContent();
    }

    /**
     * @return array{id: int, name: string, kind: string|null, managers: array<int, array{id: int, name: string}>}
     */
    private function present(User $profile): array
    {
        return [
            'id' => $profile->id,
            'name' => $profile->name,
            'kind' => $profile->managed_kind,
            'managers' => $profile->managers()->orderBy('name')->get()
                ->map(fn (User $manager) => ['id' => $manager->id, 'name' => $manager->name])->values()->all(),
        ];
    }
}
