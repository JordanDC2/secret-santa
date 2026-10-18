<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One finished game of Christmas pinball, played on its own. Its leaderboard is worked out from these.
 *
 * @property int $user_id
 * @property int $score
 * @property Carbon $created_at
 */
#[Fillable(['score'])]
class PinballGame extends Model
{
    // Only created_at: a game never changes.
    const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'score' => 'integer',
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
