<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * "Giver can't draw receiver" for a group's draw; when mutual, the reverse is blocked too.
 */
#[Fillable(['giver_id', 'receiver_id', 'mutual'])]
class GroupExclusion extends Model
{
    protected function casts(): array
    {
        return [
            'mutual' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<Group, $this>
     */
    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function giver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'giver_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    /**
     * The directed [giver, receiver] pairs this exclusion forbids.
     *
     * @return array<int, array{int, int}>
     */
    public function blockedPairs(): array
    {
        $pairs = [[$this->giver_id, $this->receiver_id]];

        if ($this->mutual) {
            $pairs[] = [$this->receiver_id, $this->giver_id];
        }

        return $pairs;
    }
}
