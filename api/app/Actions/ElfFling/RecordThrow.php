<?php

namespace App\Actions\ElfFling;

use App\Models\ElfFlingProgress;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class RecordThrow
{
    /**
     * A finished throw: kept for the leaderboards, and its coins banked. The game sends the
     * coins it collected; the lucky stocking's share is added here, from the levels the
     * server knows the player owns.
     *
     * @return array{progress: ElfFlingProgress, banked: int, newBest: bool}
     */
    public function __invoke(User $user, float $distance, int $coinsCollected): array
    {
        return DB::transaction(function () use ($user, $distance, $coinsCollected) {
            $progress = ElfFlingProgress::for($user);
            $bonus = config('elf_fling.lucky_stocking_bonus') * $progress->level('luckyStocking');
            $banked = (int) round($coinsCollected * (1 + $bonus));
            $previousBest = (float) $user->elfFlingThrows()->max('distance');

            $user->elfFlingThrows()->create(['distance' => round($distance, 1), 'coins' => $banked]);
            $progress->increment('coins', $banked);

            return ['progress' => $progress->refresh(), 'banked' => $banked, 'newBest' => $distance > $previousBest];
        });
    }
}
