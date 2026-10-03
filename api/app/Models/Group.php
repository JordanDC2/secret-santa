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

#[Fillable(['name', 'description', 'owner_id', 'join_code', 'drawn_at', 'draw_number'])]
class Group extends Model
{
    use HasFactory;

    /**
     * Matches the column default, so a group created in memory already knows it's on draw 1.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'draw_number' => 1,
    ];

    protected function casts(): array
    {
        return [
            'drawn_at' => 'datetime',
            'draw_number' => 'integer',
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

    /**
     * Every draw's assignments, including past draws kept as history.
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(SecretSantaAssignment::class);
    }

    /**
     * Assignments from the group's current draw only.
     */
    public function currentAssignments(): HasMany
    {
        return $this->assignments()->where('draw_number', $this->draw_number);
    }

    /**
     * Last draw's [giver, receiver] pairs among the given members, so a new draw can avoid
     * giving anyone the same person again.
     *
     * @param  array<int>  $memberIds
     * @return array<int, array{int, int}>
     */
    public function previousDrawPairsAmong(array $memberIds): array
    {
        return $this->assignments()
            ->where('draw_number', $this->draw_number - 1)
            ->whereIn('giver_id', $memberIds)
            ->whereIn('receiver_id', $memberIds)
            ->get()
            ->map(fn (SecretSantaAssignment $assignment) => [$assignment->giver_id, $assignment->receiver_id])
            ->all();
    }

    public function exclusions(): HasMany
    {
        return $this->hasMany(GroupExclusion::class);
    }

    /**
     * Every directed pair the draw must avoid, limited to current members.
     *
     * @param  array<int>  $memberIds
     * @return array<int, array{int, int}>
     */
    public function blockedPairsAmong(array $memberIds): array
    {
        return $this->exclusions()
            ->whereIn('giver_id', $memberIds)
            ->whereIn('receiver_id', $memberIds)
            ->get()
            ->flatMap(fn (GroupExclusion $exclusion) => $exclusion->blockedPairs())
            ->all();
    }

    public function assignmentFor(User $user): ?SecretSantaAssignment
    {
        if (! $this->drawn_at) {
            return null;
        }

        return $this->currentAssignments()->where('giver_id', $user->id)->with('receiver')->first();
    }

    protected function isDrawn(): Attribute
    {
        return Attribute::make(
            get: fn (): bool => $this->drawn_at !== null,
        );
    }
}
