<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[Fillable(['name', 'owner_id', 'join_code', 'drawn_at'])]
class Group extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'drawn_at' => 'datetime',
        ];
    }

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

    public function assignments(): HasMany
    {
        return $this->hasMany(SecretSantaAssignment::class);
    }

    public function assignmentFor(User $user): ?SecretSantaAssignment
    {
        if (! $this->drawn_at) {
            return null;
        }

        return $this->assignments()->where('giver_id', $user->id)->with('receiver')->first();
    }

    protected function isDrawn(): Attribute
    {
        return Attribute::make(
            get: fn (): bool => $this->drawn_at !== null,
        );
    }
}
