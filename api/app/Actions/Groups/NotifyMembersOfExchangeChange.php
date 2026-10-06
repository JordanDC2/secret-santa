<?php

namespace App\Actions\Groups;

use App\Jobs\SendExchangeChangeEmail;
use App\Models\Group;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class NotifyMembersOfExchangeChange
{
    /**
     * How long the email waits after the owner's last change, so a few quick edits (say, the
     * date, then the budget) become one email.
     */
    public const WAIT_MINUTES = 5;

    /**
     * After the owner saves the group: if the exchange date or budget changed, emails everyone
     * else in it WAIT_MINUTES later. Each further change restarts the wait, and the email
     * compares against the values from before the first change.
     *
     * @param  string|null  $dateBefore  "YYYY-MM-DD", as it was before this save.
     * @param  string|null  $budgetBefore  Group::budgetLabel(), as it was before this save.
     */
    public function __invoke(Group $group, User $editor, ?string $dateBefore, ?string $budgetBefore): void
    {
        $changed = $group->exchange_date?->toDateString() !== $dateBefore || $group->budgetLabel() !== $budgetBefore;
        $key = SendExchangeChangeEmail::pendingKey($group->id);

        $version = Cache::lock("{$key}:lock", 10)->block(5, function () use ($key, $changed, $editor, $dateBefore, $budgetBefore) {
            $pending = Cache::get($key);

            // A save that left the date and budget alone (a rename, say) doesn't restart the wait.
            if (! $changed) {
                return null;
            }

            $version = (string) Str::uuid();
            Cache::put($key, [
                // Keep the values from before the first change: that's what members last heard.
                'date_before' => is_array($pending) ? $pending['date_before'] : $dateBefore,
                'budget_before' => is_array($pending) ? $pending['budget_before'] : $budgetBefore,
                'editor_id' => $editor->id,
                'version' => $version,
            ], now()->addDay());

            return $version;
        });

        if ($version !== null) {
            SendExchangeChangeEmail::dispatch($group->id, $version)->delay(now()->addMinutes(self::WAIT_MINUTES));
        }
    }
}
