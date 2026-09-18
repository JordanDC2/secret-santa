<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

#[Fillable(['name', 'owner_id', 'join_code'])]
class Group extends Model
{
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (Group $group) {
            $group->join_code ??= static::generateUniqueJoinCode();
        });
    }

    public static function generateUniqueJoinCode(): string
    {
        do {
            $code = Str::upper(Str::random(6));
        } while (static::where('join_code', $code)->exists());

        return $code;
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withTimestamps();
    }
}
