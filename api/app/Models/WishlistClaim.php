<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Someone saying "I'll get this": how many of a wishlist item they're buying.
 */
#[Fillable(['user_id', 'quantity'])]
class WishlistClaim extends Model
{
    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
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
