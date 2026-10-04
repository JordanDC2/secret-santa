<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Someone saying "I'll get this": how many of a wishlist item they're buying.
 *
 * Claims never lapse; other shoppers can nudge the claimer instead.
 *
 * @property Carbon|null $claimed_at When it was made.
 * @property Carbon|null $purchased_at When the claimer marked it bought.
 * @property Carbon|null $nudged_at When someone last nudged the claimer about it.
 */
#[Fillable(['user_id', 'quantity', 'claimed_at', 'purchased_at', 'nudged_at'])]
class WishlistClaim extends Model
{
    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'claimed_at' => 'datetime',
            'purchased_at' => 'datetime',
            'nudged_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<WishlistItem, $this>
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(WishlistItem::class, 'wishlist_item_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
