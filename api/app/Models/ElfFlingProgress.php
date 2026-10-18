<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One player's Elf Fling progress: coins and gems to spend, coin and gem upgrade levels, how
 * many times they've prestiged, and the looks they own and use. The free looks (the first in
 * config/elf_fling.php) are always owned.
 *
 * @property int $user_id
 * @property int $coins
 * @property int $gems
 * @property int $prestiges
 * @property array<string, int>|null $upgrades
 * @property array<string, int>|null $gem_upgrades
 * @property array<int, string>|null $skins
 * @property string $skin
 * @property array<int, string>|null $batters
 * @property string $batter
 * @property Carbon|null $imported_at
 * @property Carbon|null $pinball_unlocked_at When they first found the chimney (pinball unlocked).
 * @property int $pinball_best Their best pinball score, played on its own.
 */
#[Fillable(['user_id', 'coins', 'gems', 'prestiges', 'upgrades', 'gem_upgrades', 'skins', 'skin', 'batters', 'batter', 'imported_at', 'pinball_unlocked_at', 'pinball_best'])]
class ElfFlingProgress extends Model
{
    protected $table = 'elf_fling_progress';

    protected function casts(): array
    {
        return [
            'coins' => 'integer',
            'gems' => 'integer',
            'prestiges' => 'integer',
            'upgrades' => 'array',
            'gem_upgrades' => 'array',
            'skins' => 'array',
            'batters' => 'array',
            'imported_at' => 'datetime',
            'pinball_unlocked_at' => 'datetime',
            'pinball_best' => 'integer',
        ];
    }

    /**
     * This player's progress, started fresh (no coins or gems, nothing bought) the first time.
     */
    public static function for(User $user): self
    {
        $progress = self::firstOrCreate(['user_id' => $user->id], [
            'coins' => 0,
            'gems' => 0,
            'prestiges' => 0,
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

        foreach ([...array_keys(config('elf_fling.upgrades')), ...array_keys(config('elf_fling.endless_upgrades'))] as $upgrade) {
            $levels[(string) $upgrade] = $this->level((string) $upgrade);
        }

        return $levels;
    }

    /**
     * An upgrade's top level, coin and gem levels together: the coin shop's levels, plus the
     * gem shop's extra levels for the upgrades that have them.
     */
    public function maxLevel(string $upgrade): int
    {
        return count(config("elf_fling.upgrades.{$upgrade}", []))
            + ($this->gemLevelsAreExtra($upgrade) ? count(config("elf_fling.gem_upgrades.{$upgrade}", [])) : 0);
    }

    /**
     * Whether the gem shop sells extra levels of this upgrade, rather than keeping the coin
     * shop's levels through prestige.
     */
    public function gemLevelsAreExtra(string $upgrade): bool
    {
        return in_array($upgrade, config('elf_fling.gem_extra'), true);
    }

    /**
     * Coin and gem levels together, as a throw uses them.
     */
    public function combinedLevel(string $upgrade): int
    {
        return min($this->maxLevel($upgrade), $this->level($upgrade) + $this->gemLevel($upgrade));
    }

    /**
     * A gem-shop upgrade's prices, level by level. The Christmas bonus gets one more level for
     * every Christmas wrapped up after the first (3, then 4, 5...), each christmas_bonus_growth
     * times the last past its listed prices.
     *
     * @return array<int, int>
     */
    public function gemUpgradePrices(string $upgrade): array
    {
        $prices = array_values((array) config("elf_fling.gem_upgrades.{$upgrade}", []));

        if ($upgrade !== 'christmasBonus' || $prices === []) {
            return $prices;
        }

        $listed = count($prices);
        $last = $prices[$listed - 1];
        $growth = config()->float('elf_fling.christmas_bonus_growth');

        for ($level = $listed; $level < max($listed, $this->prestiges + 2); $level++) {
            $prices[] = (int) round($last * $growth ** ($level - $listed + 1));
        }

        return $prices;
    }

    public function gemLevel(string $upgrade): int
    {
        return (int) ($this->gem_upgrades[$upgrade] ?? 0);
    }

    /**
     * Every gem-shop upgrade and its level, e.g. ['swingStrength' => 1, 'rocket' => 0, ...].
     *
     * @return array<string, int>
     */
    public function gemLevels(): array
    {
        $levels = [];

        foreach ([...array_keys(config('elf_fling.gem_upgrades')), ...array_keys(config('elf_fling.endless_gem_upgrades'))] as $upgrade) {
            $levels[(string) $upgrade] = $this->gemLevel((string) $upgrade);
        }

        return $levels;
    }

    /**
     * The gems prestiging now would give: the square root of (spare coins / coins_per_gem_squared),
     * rounded down.
     */
    public function prestigeGems(): int
    {
        return (int) floor(sqrt($this->coins / config('elf_fling.coins_per_gem_squared')));
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
