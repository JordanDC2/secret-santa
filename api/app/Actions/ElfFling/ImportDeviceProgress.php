<?php

namespace App\Actions\ElfFling;

use App\Events\ElfFlingLeaderboardChanged;
use App\Models\ElfFlingProgress;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ImportDeviceProgress
{
    /**
     * Brings over what a browser saved before progress lived with accounts, once per player.
     * The better of the two wins: the higher coin balance and upgrade levels, every look either
     * owns. The device's best throw goes on the all-time leaderboards (not this week's).
     * (ImportProgressRequest has already kept it to things the shop sells.)
     *
     * @param  array{coins: int, upgrades: array<string, int>, skins: array<int, string>, batters: array<int, string>, best_distance: float|null}  $device
     */
    public function __invoke(User $user, array $device): ElfFlingProgress
    {
        return DB::transaction(function () use ($user, $device) {
            $progress = ElfFlingProgress::for($user);

            if ($progress->imported_at !== null) {
                return $progress;
            }

            $levels = $progress->levels();

            foreach ($device['upgrades'] as $upgrade => $level) {
                $levels[$upgrade] = max($levels[$upgrade] ?? 0, $level);
            }

            $progress->fill([
                'coins' => max($progress->coins, $device['coins']),
                'upgrades' => array_filter($levels),
                'skins' => array_values(array_unique([...$progress->ownedSkins(), ...$device['skins']])),
                'batters' => array_values(array_unique([...$progress->ownedBatters(), ...$device['batters']])),
                'imported_at' => now(),
            ])->save();

            if ($device['best_distance'] !== null && $device['best_distance'] > 0) {
                $user->elfFlingThrows()->create([
                    'distance' => round($device['best_distance'], 1),
                    'coins' => 0,
                    'from_device' => true,
                ]);
                // Sent once the transaction commits, like the throw it adds to the boards.
                DB::afterCommit(fn () => ElfFlingLeaderboardChanged::dispatch());
            }

            return $progress;
        });
    }
}
