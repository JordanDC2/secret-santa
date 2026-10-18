<?php

namespace App\Actions\ElfFling;

use App\Models\ElfFlingProgress;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RecordPinballScore
{
    /**
     * A finished game of pinball, played on its own: kept if it beats the player's best.
     * Refused until they've found the chimney.
     */
    public function __invoke(User $user, int $score): ElfFlingProgress
    {
        return DB::transaction(function () use ($user, $score) {
            $progress = ElfFlingProgress::for($user);
            $progress = ElfFlingProgress::whereKey($progress->id)->lockForUpdate()->firstOrFail();

            if ($progress->pinball_unlocked_at === null) {
                throw ValidationException::withMessages(['score' => 'Find the chimney in Elf Fling first.']);
            }

            if ($score > $progress->pinball_best) {
                $progress->update(['pinball_best' => $score]);
            }

            return $progress;
        });
    }
}
