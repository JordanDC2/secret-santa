<?php

namespace App\Actions\ElfFling;

use App\Events\ElfFlingLeaderboardChanged;
use App\Models\ElfFlingProgress;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RecordPinballScore
{
    /**
     * A finished game of pinball, played on its own: kept for its leaderboard, and as the
     * player's best if it beats it. Refused until they've found the chimney.
     */
    public function __invoke(User $user, int $score): ElfFlingProgress
    {
        $progress = DB::transaction(function () use ($user, $score) {
            $progress = ElfFlingProgress::for($user);
            $progress = ElfFlingProgress::whereKey($progress->id)->lockForUpdate()->firstOrFail();

            if ($progress->pinball_unlocked_at === null) {
                throw ValidationException::withMessages(['score' => 'Find the chimney in Elf Fling first.']);
            }

            $user->pinballGames()->create(['score' => $score]);

            if ($score > $progress->pinball_best) {
                $progress->update(['pinball_best' => $score]);
            }

            return $progress;
        });

        // Once it's saved, anyone watching the leaderboards sees it.
        ElfFlingLeaderboardChanged::dispatch();

        return $progress;
    }
}
