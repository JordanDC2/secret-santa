<?php

namespace App\Actions\ElfFling;

use App\Models\ElfFlingProgress;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class Prestige
{
    /**
     * Wraps up this Christmas: the player's spare coins become gems (see
     * ElfFlingProgress::prestigeGems), and their coins and coin upgrades start again from
     * nothing. Gems, gem upgrades, looks and every throw stay.
     * Refused if the coins wouldn't make a single gem.
     *
     * @return array{progress: ElfFlingProgress, gems: int}
     */
    public function __invoke(User $user): array
    {
        return DB::transaction(function () use ($user) {
            $progress = ElfFlingProgress::for($user);
            $progress = ElfFlingProgress::whereKey($progress->id)->lockForUpdate()->firstOrFail();
            $gems = $progress->prestigeGems();

            if ($gems < 1) {
                throw ValidationException::withMessages(['coins' => 'Not enough coins to make a gem yet.']);
            }

            $progress->fill([
                'gems' => $progress->gems + $gems,
                'prestiges' => $progress->prestiges + 1,
                'coins' => 0,
                'upgrades' => [],
            ])->save();

            return ['progress' => $progress, 'gems' => $gems];
        });
    }
}
