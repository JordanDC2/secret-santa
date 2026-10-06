<?php

namespace App\Actions\Wishlist;

use App\Models\User;
use App\Models\WishlistItem;
use App\Notifications\SuggestionChanged;

/**
 * Lets the person who suggested a gift know when someone else edits or removes it, since
 * anyone shopping for that person can change suggestions.
 */
class NotifySuggesterOfChange
{
    /**
     * @param  array<string, array{mixed, mixed}>  $changes  Field => [before, after].
     */
    public function __invoke(WishlistItem $item, User $editor, array $changes, bool $removed = false): void
    {
        $suggester = $item->suggestedBy;

        if (! $item->is_suggestion || ! $suggester || $suggester->is($editor) || (! $removed && $changes === [])) {
            return;
        }

        $suggester->notify(new SuggestionChanged(
            ownerId: $item->user_id,
            ownerName: $item->owner->full_name,
            itemName: (string) ($changes['name'][0] ?? $item->name),
            // Same rule as claims: only name people the suggester shares a group with.
            editorName: $suggester->sharesGroupWith($editor) ? $editor->full_name : null,
            changes: $changes,
            removed: $removed,
        ));
    }
}
