<?php

namespace App\Actions\ElfFling;

use App\Models\ElfFlingProgress;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BuyItem
{
    /**
     * Buys the next level of an upgrade, or a look (which is put to use at once), at the price
     * in config/elf_fling.php. Refused if it's not for sale, already owned or maxed, or the
     * player can't afford it.
     *
     * @param  'upgrade'|'skin'|'batter'  $kind
     */
    public function __invoke(User $user, string $kind, string $item): ElfFlingProgress
    {
        return DB::transaction(function () use ($user, $kind, $item) {
            $progress = ElfFlingProgress::for($user);
            $progress = ElfFlingProgress::whereKey($progress->id)->lockForUpdate()->firstOrFail();

            $price = match ($kind) {
                'upgrade' => $this->upgradePrice($progress, $item),
                'skin' => $this->lookPrice('skins', $item, $progress->ownedSkins()),
                'batter' => $this->lookPrice('batters', $item, $progress->ownedBatters()),
            };

            if ($progress->coins < $price) {
                throw ValidationException::withMessages(['item' => 'Not enough coins for that yet.']);
            }

            $progress->coins -= $price;

            if ($kind === 'upgrade') {
                $progress->upgrades = [...($progress->upgrades ?? []), $item => $progress->level($item) + 1];
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

    private function upgradePrice(ElfFlingProgress $progress, string $upgrade): int
    {
        $prices = config("elf_fling.upgrades.{$upgrade}");

        if (! is_array($prices)) {
            throw ValidationException::withMessages(['item' => 'That isn\'t in the shop.']);
        }

        return $prices[$progress->level($upgrade)]
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
