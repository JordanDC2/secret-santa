<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One message in a Santa ↔ person thread. Who wrote it is a side ("santa" or "person"),
 * never a user id, so nothing sent to the person can reveal their Santa.
 */
#[Fillable(['secret_santa_assignment_id', 'from_santa', 'body', 'read_at'])]
class SantaMessage extends Model
{
    protected function casts(): array
    {
        return [
            'from_santa' => 'boolean',
            'read_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<SecretSantaAssignment, $this>
     */
    public function assignment(): BelongsTo
    {
        return $this->belongsTo(SecretSantaAssignment::class, 'secret_santa_assignment_id');
    }
}
