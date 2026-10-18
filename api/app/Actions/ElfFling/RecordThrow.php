<?php

namespace App\Actions\ElfFling;

use App\Events\ElfFlingLeaderboardChanged;
use App\Models\ElfFlingProgress;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class RecordThrow
{
    /**
     * A finished throw: kept for the leaderboards, and its coins banked. The game sends the
     * coins it collected; the lucky stocking's, workshop overtime's and Santa's ledger's shares
     * are added here, then the Christmas bonus doubles it once per level, from the levels (coin and gem) the server knows the player owns.
     *
     * @return array{progress: ElfFlingProgress, banked: int, newBest: bool, score: int}
     */
    public function __invoke(User $user, float $distance, int $coinsCollected): array
    {
        $result = DB::transaction(function () use ($user, $distance, $coinsCollected) {
            $progress = ElfFlingProgress::for($user);
            $bonus = config('elf_fling.lucky_stocking_bonus') * $progress->combinedLevel('luckyStocking');
            $overtime = config('elf_fling.workshop_overtime_bonus') * $progress->level('workshopOvertime');
            $ledger = config('elf_fling.santas_ledger_bonus') * $progress->gemLevel('santasLedger');
            $multiplier = 2 ** $progress->gemLevel('christmasBonus');
            $banked = (int) round($coinsCollected * (1 + $bonus) * (1 + $overtime) * (1 + $ledger) * $multiplier);
            $previousBest = (float) $user->elfFlingThrows()->max('distance');

            $user->elfFlingThrows()->create([
                'distance' => round($distance, 1),
                'coins' => $banked,
                'score' => self::score($distance, $coinsCollected),
            ]);
            $progress->increment('coins', $banked);

            return [
                'progress' => $progress->refresh(),
                'banked' => $banked,
                'newBest' => $distance > $previousBest,
                'score' => self::score($distance, $coinsCollected),
            ];
        });

        // Once it's saved, anyone watching the leaderboards sees it.
        ElfFlingLeaderboardChanged::dispatch();

        return $result;
    }

    /**
     * A throw's score: its distance in whole metres plus the coins it collected, before any
     * multipliers, so it compares fairly between players at different stages.
     */
    public static function score(float $distance, int $coinsCollected): int
    {
        return (int) round($distance) + $coinsCollected;
    }
}
