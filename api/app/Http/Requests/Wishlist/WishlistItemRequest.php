<?php

namespace App\Http\Requests\Wishlist;

use App\Models\WishlistItem;
use Illuminate\Foundation\Http\FormRequest;

class WishlistItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    private function isSuggestion(): bool
    {
        $item = $this->route('item');

        return $this->routeIs('wishlist.suggestions.store') || ($item instanceof WishlistItem && $item->is_suggestion);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            // Only web links, so a crafted "javascript:" URL can't run when someone clicks it.
            'url' => ['nullable', 'url:http,https', 'max:2048'],
            'image_url' => ['nullable', 'url:http,https', 'max:2048'],
            'price' => ['nullable', 'numeric', 'min:0', 'max:99999999.99'],
            'quantity' => ['sometimes', 'integer', 'between:1,99'],
            'notes' => ['nullable', 'string', 'max:2000'],
            // Only the owner can say how much they want something, so suggestions have no rating.
            'rating' => $this->isSuggestion() ? ['exclude'] : ['required', 'integer', 'between:1,5'],
        ];
    }
}
