<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One finished night of Silent Night. Its leaderboards are worked out from these.
 *
 * @property int $user_id
 * @property int $seconds
 * @property int $kills
 * @property int $level
 * @property int $bargains
 * @property bool $won
 * @property Carbon $created_at
 */
#[Fillable(['seconds', 'kills', 'level', 'bargains', 'won'])]
class SilentNightRun extends Model
{
    // Only created_at: a night never changes.
    const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'seconds' => 'integer',
            'kills' => 'integer',
            'level' => 'integer',
            'bargains' => 'integer',
            'won' => 'boolean',
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
