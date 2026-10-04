<?php

use App\Models\Group;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('group.{group}', fn (User $user, Group $group) => $user->can('view', $group));

Broadcast::channel('wishlist.{owner}', fn (User $user, User $owner) => $user->can('receiveWishlistUpdates', $owner));

// Someone's own updates, e.g. their Santa chats. Only they can listen.
Broadcast::channel('user.{id}', fn (User $user, int $id) => $user->id === $id);
