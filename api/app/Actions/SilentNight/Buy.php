<?php

namespace App\Actions\SilentNight;

use App\Models\SilentNightProgress;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class Buy
{
    /**
     * Buys the next level of a Coal Cellar upgrade, or unlocks one of the second wave of patrons
     * or of the cast (who's then picked to play as), with coal at the price in
     * config/silent_night.php. Refused if it's not for sale, already maxed or owned, or the
     * player hasn't the coal.
     *
     * @param  'cellar'|'patron'|'cast'  $kind
     */
    public function __invoke(User $user, string $kind, string $item): SilentNightProgress
    {
        return DB::transaction(function () use ($user, $kind, $item) {
            $progress = SilentNightProgress::for($user);
            $progress = SilentNightProgress::whereKey($progress->id)->lockForUpdate()->firstOrFail();
            $price = match ($kind) {
                'cellar' => $this->cellarPrice($progress, $item),
                'patron' => $this->patronPrice($progress, $item),
                'cast' => $this->castPrice($progress, $item),
            };

            if ($progress->coal < $price) {
                throw ValidationException::withMessages(['item' => 'Not enough coal for that yet.']);
            }

            $progress->coal -= $price;

            if ($kind === 'cellar') {
                $progress->cellar = [...($progress->cellar ?? []), $item => $progress->level($item) + 1];
            } elseif ($kind === 'patron') {
                $progress->patrons = [...($progress->patrons ?? []), $item];
            } else {
                $progress->cast = [...$progress->ownedCast(), $item];
                $progress->character = $item;
            }

            $progress->save();

            return $progress;
        });
    }

    private function cellarPrice(SilentNightProgress $progress, string $upgrade): int
    {
        $prices = config("silent_night.cellar.{$upgrade}");

        if (! is_array($prices)) {
            throw ValidationException::withMessages(['item' => 'That isn\'t in the Cellar.']);
        }

        return $prices[$progress->level($upgrade)]
            ?? throw ValidationException::withMessages(['item' => 'That\'s already fully upgraded.']);
    }

    private function patronPrice(SilentNightProgress $progress, string $patron): int
    {
        $price = config("silent_night.patrons.{$patron}");

        if (! is_int($price)) {
            throw ValidationException::withMessages(['item' => 'No patron by that name.']);
        }

        if (in_array($patron, $progress->patrons ?? [], true)) {
            throw ValidationException::withMessages(['item' => 'Their shrines already appear.']);
        }

        return $price;
    }

    private function castPrice(SilentNightProgress $progress, string $character): int
    {
        $price = config("silent_night.cast.{$character}");

        if (! is_int($price)) {
            throw ValidationException::withMessages(['item' => 'No one by that name.']);
        }

        if (in_array($character, $progress->ownedCast(), true)) {
            throw ValidationException::withMessages(['item' => 'You can already play as them.']);
        }

        return $price;
    }
}
