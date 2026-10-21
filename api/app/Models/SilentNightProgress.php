<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One player's Silent Night progress: coal to spend, the Coal Cellar's upgrade levels, and the
 * cast they've unlocked (the first in config/silent_night.php is always theirs) and last played as.
 *
 * @property int $user_id
 * @property int $coal
 * @property array<string, int>|null $cellar
 * @property array<int, string>|null $cast
 * @property string $character
 */
#[Fillable(['user_id', 'coal', 'cellar', 'cast', 'character'])]
class SilentNightProgress extends Model
{
    protected $table = 'silent_night_progress';

    protected function casts(): array
    {
        return [
            'coal' => 'integer',
            'cellar' => 'array',
            'cast' => 'array',
        ];
    }

    /**
     * This player's progress, started fresh (no coal, nothing bought) the first time.
     */
    public static function for(User $user): self
    {
        $progress = self::firstOrCreate(['user_id' => $user->id], [
            'coal' => 0,
            'character' => array_key_first(config('silent_night.cast')),
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
        return (int) ($this->cellar[$upgrade] ?? 0);
    }

    /**
     * Every Cellar upgrade's level, those not bought at 0.
     *
     * @return array<string, int>
     */
    public function levels(): array
    {
        $levels = [];

        foreach (array_keys(config('silent_night.cellar')) as $upgrade) {
            $levels[(string) $upgrade] = $this->level((string) $upgrade);
        }

        return $levels;
    }

    /**
     * Who they can play as: the free one, and everyone unlocked.
     *
     * @return array<int, string>
     */
    public function ownedCast(): array
    {
        return array_values(array_unique([array_key_first(config('silent_night.cast')), ...($this->cast ?? [])]));
    }
}
