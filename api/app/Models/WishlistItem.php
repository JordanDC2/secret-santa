<?php

namespace App\Models;

use Database\Factories\WishlistItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property Carbon|null $received_at When the owner marked it "Got it".
 */
#[Fillable(['name', 'url', 'image_url', 'price', 'quantity', 'notes', 'rating', 'is_suggestion', 'suggested_by_id', 'received_at'])]
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
            'is_suggestion' => 'boolean',
            'received_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Who added this gift idea, for suggestions. Null for the owner's own items, and for a
     * suggestion whose suggester has since deleted their account.
     *
     * @return BelongsTo<User, $this>
     */
    public function suggestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'suggested_by_id');
    }

    /**
     * @return HasMany<WishlistClaim, $this>
     */
    public function claims(): HasMany
    {
        return $this->hasMany(WishlistClaim::class);
    }

    /**
     * How many are still up for grabs. Uses loaded claims when present.
     */
    public function remainingQuantity(): int
    {
        return max(0, $this->quantity - (int) $this->claims->sum('quantity'));
    }

    /**
     * Most-wanted first (highest stars), then in the order they were added.
     *
     * @param  Builder<self>  $query
     */
    #[Scope]
    protected function mostWantedFirst(Builder $query): void
    {
        $query->orderByDesc('rating')->orderBy('id');
    }
}
