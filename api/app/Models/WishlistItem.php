<?php

namespace App\Models;

use Database\Factories\WishlistItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'url', 'image_url', 'price', 'quantity', 'notes', 'rating'])]
class WishlistItem extends Model
{
    /** @use HasFactory<WishlistItemFactory> */
    use HasFactory;

    /**
     * Matches the column default, so a new item reports quantity 1 before it's reloaded.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'quantity' => 1,
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'rating' => 'integer',
            'quantity' => 'integer',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function claims(): HasMany
    {
        return $this->hasMany(WishlistClaim::class);
    }

    /**
     * How many are still up for grabs. Uses loaded claims when present.
     */
    public function remainingQuantity(): int
    {
        return max(0, $this->quantity - $this->claims->sum('quantity'));
    }

    /**
     * Most-wanted first (highest stars), then in the order they were added.
     */
    public function scopeMostWantedFirst(Builder $query): void
    {
        $query->orderByDesc('rating')->orderBy('id');
    }
}
