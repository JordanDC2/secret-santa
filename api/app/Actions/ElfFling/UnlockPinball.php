<?php

namespace App\Actions\ElfFling;

use App\Models\ElfFlingProgress;
use App\Models\User;

class UnlockPinball
{
    /**
     * The player found the chimney: Christmas pinball is theirs to play on its own from now on.
     * The first time is the one that counts; later finds change nothing.
     */
    public function __invoke(User $user): ElfFlingProgress
    {
        $progress = ElfFlingProgress::for($user);

        if ($progress->pinball_unlocked_at === null) {
            $progress->update(['pinball_unlocked_at' => now()]);
        }

        return $progress;
    }
}
