<?php

use App\Models\Group;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('group.{group}', fn (User $user, Group $group) => $user->can('view', $group));

Broadcast::channel('wishlist.{owner}', fn (User $user, User $owner) => $user->can('receiveWishlistUpdates', $owner));
