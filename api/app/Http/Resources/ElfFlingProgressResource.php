<?php

namespace App\Http\Resources;

use App\Models\ElfFlingProgress;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A player's Elf Fling progress for the game: coins, every upgrade's level, the looks owned
 * and in use, and their best throw ever.
 *
 * @mixin ElfFlingProgress
 */
class ElfFlingProgressResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $best = $this->user->elfFlingThrows()->max('distance');

        return [
            'coins' => $this->coins,
            'upgrades' => $this->levels(),
            'skins' => $this->ownedSkins(),
            'skin' => $this->skin,
            'batters' => $this->ownedBatters(),
            'batter' => $this->batter,
            'best_distance' => $best === null ? null : round((float) $best, 1),
            // Whether a device's own saved progress has been brought over (it happens once).
            'imported' => $this->imported_at !== null,
        ];
    }
}
