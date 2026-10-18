<?php

namespace App\Actions\ElfFling;

use App\Models\ElfFlingProgress;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BuyItem
{
    /**
     * Buys the next level of an upgrade, with coins or (kept through prestige) with gems, or a
     * look (which is put to use at once), at the price in config/elf_fling.php. Refused if it's
     * not for sale, already owned or maxed, or the player can't afford it. The endless upgrades
     * (Santa's ledger among them) can be bought several levels at once ($count), all or none.
     *
     * @param  'upgrade'|'gemUpgrade'|'skin'|'batter'  $kind
     */
    public function __invoke(User $user, string $kind, string $item, int $count = 1): ElfFlingProgress
    {
        return DB::transaction(function () use ($user, $kind, $item, $count) {
            $progress = ElfFlingProgress::for($user);
            $progress = ElfFlingProgress::whereKey($progress->id)->lockForUpdate()->firstOrFail();

            $price = match ($kind) {
                'upgrade' => $this->coinUpgradePrice($progress, $item, $count),
                'gemUpgrade' => $this->gemUpgradePrice($progress, $item, $count),
                'skin' => $this->lookPrice('skins', $item, $progress->ownedSkins()),
                'batter' => $this->lookPrice('batters', $item, $progress->ownedBatters()),
            };

            if ($kind === 'gemUpgrade') {
                if ($progress->gems < $price) {
                    throw ValidationException::withMessages(['item' => 'Not enough gems for that yet.']);
                }

                $progress->gems -= $price;
            } elseif ($progress->coins < $price) {
                throw ValidationException::withMessages(['item' => 'Not enough coins for that yet.']);
            } else {
                $progress->coins -= $price;
            }

            if ($kind === 'gemUpgrade') {
                $progress->gem_upgrades = [...($progress->gem_upgrades ?? []), $item => $progress->gemLevel($item) + $count];
            } elseif ($kind === 'upgrade') {
                $progress->upgrades = [...($progress->upgrades ?? []), $item => $progress->level($item) + $count];
            } elseif ($kind === 'skin') {
                $progress->skins = [...$progress->ownedSkins(), $item];
                $progress->skin = $item;
            } else {
                $progress->batters = [...$progress->ownedBatters(), $item];
                $progress->batter = $item;
            }

            $progress->save();

            return $progress;
        });
    }

    /**
     * The next coin level's price. Nothing's left to buy with coins once the coin and gem
     * levels together reach the top. Kept levels count as bought, so the next is priced as
     * the level after them.
     */
    private function coinUpgradePrice(ElfFlingProgress $progress, string $upgrade, int $count): int
    {
        if (config()->has("elf_fling.endless_upgrades.{$upgrade}")) {
            if ($progress->prestiges < config('elf_fling.endless_from_prestige')) {
                throw ValidationException::withMessages(['item' => 'That isn\'t in the shop yet.']);
            }

            return $this->endlessPrice("elf_fling.endless_upgrades.{$upgrade}", $progress->level($upgrade), $count);
        }

        if ($count !== 1) {
            throw ValidationException::withMessages(['item' => 'That one comes a level at a time.']);
        }

        $prices = (array) config("elf_fling.upgrades.{$upgrade}", []);

        if ($prices !== [] && $progress->combinedLevel($upgrade) >= $progress->maxLevel($upgrade)) {
            throw ValidationException::withMessages(['item' => 'That\'s already fully upgraded.']);
        }

        $level = $progress->gemLevelsAreExtra($upgrade) ? $progress->level($upgrade) : $progress->combinedLevel($upgrade);

        return $this->levelPrice($prices, $level);
    }

    /**
     * The next gem-shop level's price, or the next $count levels of Santa's ledger together.
     */
    private function gemUpgradePrice(ElfFlingProgress $progress, string $upgrade, int $count): int
    {
        if (config()->has("elf_fling.endless_gem_upgrades.{$upgrade}")) {
            return $this->endlessPrice("elf_fling.endless_gem_upgrades.{$upgrade}", $progress->gemLevel($upgrade), $count);
        }

        if ($count !== 1) {
            throw ValidationException::withMessages(['item' => 'That one comes a level at a time.']);
        }

        return $this->levelPrice($progress->gemUpgradePrices($upgrade), $progress->gemLevel($upgrade));
    }

    /**
     * An endless upgrade's next $count levels from $level, each priced on its own (base ×
     * growth ^ level, from its config at $key), with no top level.
     */
    private function endlessPrice(string $key, int $level, int $count): int
    {
        $base = config()->integer("{$key}.base");
        $growth = config()->float("{$key}.growth");
        $total = 0;

        for ($next = $level; $next < $level + $count; $next++) {
            $total += (int) round($base * $growth ** $next);
        }

        return $total;
    }

    /**
     * The price of the next level, from an upgrade's prices in order.
     *
     * @param  array<int, int>  $prices
     */
    private function levelPrice(array $prices, int $level): int
    {
        if ($prices === []) {
            throw ValidationException::withMessages(['item' => 'That isn\'t in the shop.']);
        }

        return $prices[$level]
            ?? throw ValidationException::withMessages(['item' => 'That\'s already fully upgraded.']);
    }

    /**
     * @param  'skins'|'batters'  $kind
     * @param  array<int, string>  $owned
     */
    private function lookPrice(string $kind, string $look, array $owned): int
    {
        $price = config("elf_fling.{$kind}.{$look}");

        if (! is_int($price)) {
            throw ValidationException::withMessages(['item' => 'That isn\'t in the shop.']);
        }

        if (in_array($look, $owned, true)) {
            throw ValidationException::withMessages(['item' => 'You already have that one.']);
        }

        return $price;
    }
}
