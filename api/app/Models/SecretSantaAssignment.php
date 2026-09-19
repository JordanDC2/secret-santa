<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['group_id', 'giver_id', 'receiver_id'])]
class SecretSantaAssignment extends Model
{
    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function giver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'giver_id');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }
}
