<?php

namespace App\Http\Resources;

use App\Models\SilentNightProgress;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A player's Silent Night progress for the game: their coal, every Coal Cellar upgrade's level,
 * the second-wave patrons unlocked, who they've unlocked and last played as, and the guns unlocked.
 *
 * @mixin SilentNightProgress
 */
class SilentNightProgressResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'coal' => $this->coal,
            'cellar' => $this->levels(),
            'cast' => $this->ownedCast(),
            'patrons' => $this->patrons ?? [],
            'guns' => $this->ownedGuns(),
            'character' => $this->character,
        ];
    }
}
