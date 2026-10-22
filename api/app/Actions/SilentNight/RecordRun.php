<?php

namespace App\Actions\SilentNight;

use App\Models\SilentNightProgress;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class RecordRun
{
    /**
     * A finished night, kept for the leaderboards, and the coal it earned (worked out here, from
     * config/silent_night.php, with the coal picked up during it) banked.
     *
     * @param  array{seconds: int, kills: int, level: int, bargains: int, won: bool, bosses: int, coal_found?: int}  $run
     * @return array{coal_earned: int, progress: SilentNightProgress}
     */
    public function __invoke(User $user, array $run): array
    {
        $coal = intdiv($run['seconds'], config()->integer('silent_night.coal.seconds_per_coal'))
            + intdiv($run['kills'], config()->integer('silent_night.coal.kills_per_coal'))
            + $run['bosses'] * config()->integer('silent_night.coal.per_boss')
            + ($run['won'] ? config()->integer('silent_night.coal.for_winning') : 0)
            + ($run['coal_found'] ?? 0);

        $progress = DB::transaction(function () use ($user, $run, $coal) {
            $user->silentNightRuns()->create([
                'seconds' => $run['seconds'],
                'kills' => $run['kills'],
                'level' => $run['level'],
                'bargains' => $run['bargains'],
                'won' => $run['won'],
            ]);
            $progress = SilentNightProgress::for($user);
            $progress = SilentNightProgress::whereKey($progress->id)->lockForUpdate()->firstOrFail();
            $progress->increment('coal', $coal);

            return $progress;
        });

        return ['coal_earned' => $coal, 'progress' => $progress];
    }
}
