<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Account\DeleteAccount;
use App\Events\GroupChanged;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateAccountRequest;
use App\Models\Group;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Everyone with a login, for the admin page: who they are, when they were last around and
 * which groups they run or belong to. Kids and pets show under the people looking after them.
 */
class AccountController extends Controller
{
    public function index(): JsonResponse
    {
        $lastSeen = DB::table('sessions')
            ->whereNotNull('user_id')
            ->groupBy('user_id')
            ->pluck(DB::raw('max(last_activity)'), 'user_id');

        $accounts = User::whereNull('managed_kind')
            ->with([
                'ownedGroups' => fn ($groups) => $groups->withCount('members')->orderBy('name'),
                'groups' => fn ($groups) => $groups->orderBy('name'),
                'managedProfiles' => fn ($profiles) => $profiles->withCount('managers')->orderBy('first_name'),
            ])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'is_admin' => $user->is_admin,
                'email_verified' => $user->hasVerifiedEmail(),
                'created_at' => $user->created_at?->toIso8601String(),
                // Sessions expire after a while, so someone long gone shows as null.
                'last_seen_at' => isset($lastSeen[$user->id]) ? Carbon::createFromTimestamp((int) $lastSeen[$user->id])->toIso8601String() : null,
                'owned_groups' => $user->ownedGroups->map(fn (Group $group) => [
                    'id' => $group->id,
                    'name' => $group->name,
                    'members_count' => $group->members_count,
                    'is_drawn' => $group->drawn_at !== null,
                ])->values(),
                'member_of' => $user->groups
                    ->reject(fn (Group $group) => $group->owner_id === $user->id)
                    ->map(fn (Group $group) => ['id' => $group->id, 'name' => $group->name])
                    ->values(),
                'kids_and_pets' => $user->managedProfiles->map(fn (User $profile) => [
                    'id' => $profile->id,
                    'name' => $profile->full_name,
                    'kind' => $profile->managed_kind,
                    // Deleted along with this account (see DeleteAccount).
                    'only_carer' => $profile->managers_count === 1,
                ])->values(),
            ]);

        return response()->json($accounts);
    }

    /**
     * Fix someone's name or a mistyped email. No password needed: this is the owner helping out.
     */
    public function update(UpdateAccountRequest $request, User $user): JsonResponse
    {
        $user->fill($request->safe()->only('first_name', 'last_name', 'email'));
        $emailChanged = $user->isDirty('email');

        // A corrected address still needs confirming. No heads-up to the old one: it was usually a typo.
        if ($emailChanged) {
            $user->email_verified_at = null;
        }

        $user->save();

        if ($emailChanged) {
            $user->sendEmailVerificationNotification();
        }

        // Their name shows on other members' group cards.
        $user->groups()->pluck('groups.id')->each(fn (int $groupId) => GroupChanged::dispatch($groupId));

        return response()->json(['id' => $user->id, 'full_name' => $user->full_name, 'email' => $user->email]);
    }

    /**
     * Same as someone deleting their own account: their groups go with them.
     */
    public function destroy(DeleteAccount $action, User $user): Response
    {
        abort_if($user->isManagedProfile(), 404);
        abort_if($user->is_admin, 422, "You can't delete your own account from here. Use Settings instead.");

        $action($user);

        return response()->noContent();
    }
}
