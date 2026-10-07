<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\SantaMessage;
use App\Models\User;
use App\Models\WishlistItem;
use App\Support\Admin\SystemHealth;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

/**
 * The admin page's top half: how big the site is, recent sign-ups and system health. Counts
 * only; nothing here says who drew whom, what anyone claimed or what was said in a chat.
 */
class OverviewHandler extends Controller
{
    private const SIGN_UP_DAYS = 30;

    public function __invoke(SystemHealth $health): JsonResponse
    {
        return response()->json([
            'counts' => [
                'accounts' => User::whereNull('managed_kind')->count(),
                'kids_and_pets' => User::whereNotNull('managed_kind')->count(),
                'groups' => Group::count(),
                'drawn_groups' => Group::whereNotNull('drawn_at')->count(),
                'wishlist_items' => WishlistItem::count(),
                'santa_messages' => SantaMessage::count(),
            ],
            'sign_ups' => $this->signUpsByDay(),
            'health' => $health->report(),
        ]);
    }

    /**
     * New accounts per day for the last SIGN_UP_DAYS days, oldest first, in the admin's
     * timezone so "today" means the owner's today. Days with none are included as 0.
     *
     * @return array<int, array{date: string, count: int}>
     */
    private function signUpsByDay(): array
    {
        $timezone = (string) config('app.admin_timezone');
        $today = Carbon::now($timezone)->startOfDay();
        $first = $today->copy()->subDays(self::SIGN_UP_DAYS - 1);

        $perDay = User::whereNull('managed_kind')
            ->where('created_at', '>=', $first->copy()->utc())
            ->pluck('created_at')
            ->countBy(fn (Carbon $createdAt) => $createdAt->copy()->setTimezone($timezone)->toDateString());

        return collect(range(0, self::SIGN_UP_DAYS - 1))
            ->map(function (int $offset) use ($first, $perDay) {
                $date = $first->copy()->addDays($offset)->toDateString();

                return ['date' => $date, 'count' => (int) $perDay->get($date, 0)];
            })
            ->all();
    }
}
