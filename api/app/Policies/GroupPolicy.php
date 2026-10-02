<?php

namespace App\Policies;

use App\Models\Group;
use App\Models\User;

class GroupPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Group $group): bool
    {
        return $group->members()->where('user_id', $user->id)->exists();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can rename the group.
     */
    public function update(User $user, Group $group): bool
    {
        return $user->id === $group->owner_id;
    }

    /**
     * Only the owner sees or edits who can't draw whom.
     */
    public function manageExclusions(User $user, Group $group): bool
    {
        return $user->id === $group->owner_id;
    }

    /**
     * Only the owner can check the draw or see who drew whom.
     */
    public function viewDraw(User $user, Group $group): bool
    {
        return $user->id === $group->owner_id;
    }

    /**
     * Determine whether the user can draw names for the group.
     */
    public function draw(User $user, Group $group): bool
    {
        return $user->id === $group->owner_id;
    }

    /**
     * Determine whether the user can delete the group.
     */
    public function delete(User $user, Group $group): bool
    {
        return $user->id === $group->owner_id;
    }

    /**
     * Determine whether the user can leave the group. Owners delete it instead.
     */
    public function leave(User $user, Group $group): bool
    {
        return $user->id !== $group->owner_id && $this->view($user, $group);
    }
}
