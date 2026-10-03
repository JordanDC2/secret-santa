<?php

namespace App\Actions\Groups;

use App\Models\Group;
use Illuminate\Validation\ValidationException;

class StartNewDraw
{
    /**
     * Opens the next draw (e.g. next Christmas): the current assignments stay as history,
     * and the group is back to "not drawn" with its members, exclusions and note intact.
     * Wishlist claims aren't touched, so nothing already bought gets bought twice.
     */
    public function __invoke(Group $group): Group
    {
        $opened = Group::whereKey($group->id)
            ->whereNotNull('drawn_at')
            ->where('draw_number', $group->draw_number)
            ->update(['drawn_at' => null, 'draw_number' => $group->draw_number + 1]);

        if (! $opened) {
            throw ValidationException::withMessages([
                'group' => ["Names haven't been drawn yet, so there's nothing to start over."],
            ]);
        }

        return $group->refresh();
    }
}
