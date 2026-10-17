<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One player's Elf Fling progress: coins to spend, upgrade levels, and the looks they own
 * and use. The free looks (the first in config/elf_fling.php) are always owned.
 *
 * @property int $user_id
 * @property int $coins
 * @property array<string, int>|null $upgrades
 * @property array<int, string>|null $skins
 * @property string $skin
 * @property array<int, string>|null $batters
 * @property string $batter
 * @property Carbon|null $imported_at
 */
#[Fillable(['user_id', 'coins', 'upgrades', 'skins', 'skin', 'batters', 'batter', 'imported_at'])]
class ElfFlingProgress extends Model
{
    protected $table = 'elf_fling_progress';

    protected function casts(): array
    {
        return [
            'coins' => 'integer',
            'upgrades' => 'array',
            'skins' => 'array',
            'batters' => 'array',
            'imported_at' => 'datetime',
        ];
    }

    /**
     * This player's progress, started fresh (no coins, nothing bought) the first time.
     */
    public static function for(User $user): self
    {
        $progress = self::firstOrCreate(['user_id' => $user->id], [
            'coins' => 0,
            'skin' => array_key_first(config('elf_fling.skins')),
            'batter' => array_key_first(config('elf_fling.batters')),
        ]);
        // Starting it is a detail, not something the player made: answer 200, not 201 Created.
        $progress->wasRecentlyCreated = false;

        return $progress;
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function level(string $upgrade): int
    {
        return (int) ($this->upgrades[$upgrade] ?? 0);
    }

    /**
     * Every upgrade and its level, e.g. ['swingStrength' => 2, 'rocket' => 0, ...].
     *
     * @return array<string, int>
     */
    public function levels(): array
    {
        $levels = [];

        foreach (array_keys(config('elf_fling.upgrades')) as $upgrade) {
            $levels[(string) $upgrade] = $this->level((string) $upgrade);
        }

        return $levels;
    }

    /**
     * The flyer skins owned, the free one first.
     *
     * @return array<int, string>
     */
    public function ownedSkins(): array
    {
        return self::withFree('skins', $this->skins);
    }

    /**
     * The batters owned, the free one first.
     *
     * @return array<int, string>
     */
    public function ownedBatters(): array
    {
        return self::withFree('batters', $this->batters);
    }

    /**
     * A list of owned looks with the free one (the first in the config) included.
     *
     * @param  'skins'|'batters'  $kind
     * @param  array<int, string>|null  $owned
     * @return array<int, string>
     */
    private static function withFree(string $kind, ?array $owned): array
    {
        $free = array_key_first(config("elf_fling.{$kind}"));

        return array_values(array_unique([$free, ...($owned ?? [])]));
    }
}
