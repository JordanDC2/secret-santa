<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One finished Elf Fling throw: how far it went, the coins it banked, and its score. The leaderboards are
 * worked out from these.
 *
 * @property int $user_id
 * @property float $distance
 * @property int $coins
 * @property int $score Distance in metres plus coins collected (before multipliers).
 * @property bool $from_device A best throw brought over from a device: all time only, not this week.
 * @property Carbon $created_at
 */
#[Fillable(['distance', 'coins', 'score', 'from_device', 'created_at'])]
class ElfFlingThrow extends Model
{
    // Only created_at: a throw never changes.
    const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'distance' => 'float',
            'coins' => 'integer',
            'score' => 'integer',
            'from_device' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
