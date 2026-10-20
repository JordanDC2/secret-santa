<?php

namespace App\Actions\SilentNight;

use App\Models\SilentNightRun;
use App\Models\User;

class RecordRun
{
    /**
     * A finished night, kept for the leaderboards.
     *
     * @param  array{seconds: int, kills: int, level: int, bargains: int, won: bool}  $run
     */
    public function __invoke(User $user, array $run): SilentNightRun
    {
        return $user->silentNightRuns()->create($run);
    }
}
