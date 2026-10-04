<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['group_id', 'draw_number', 'giver_id', 'receiver_id'])]
class SecretSantaAssignment extends Model
{
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
     * The anonymous thread between this giver (the Santa) and receiver (their person).
     *
     * @return HasMany<SantaMessage, $this>
     */
    public function messages(): HasMany
    {
        return $this->hasMany(SantaMessage::class);
    }

    /**
     * Messages from the other side that this side hasn't opened yet.
     */
    public function unreadCountFor(bool $viewerIsSanta): int
    {
        return $this->messages()->where('from_santa', ! $viewerIsSanta)->whereNull('read_at')->count();
    }
}
