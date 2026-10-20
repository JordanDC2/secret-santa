<?php

namespace App\Http\Controllers\SilentNight;

use App\Http\Controllers\Controller;
use App\Http\Requests\SilentNight\LeaderboardRequest;
use App\Support\SilentNight\Leaderboard;
use Illuminate\Http\JsonResponse;

/**
 * A Silent Night leaderboard across everyone: the longest night, Krampus beaten with the most
 * bargains taken, or the most broken in a night; this week or all time.
 */
class LeaderboardHandler extends Controller
{
    public function __invoke(LeaderboardRequest $request): JsonResponse
    {
        /** @var 'night'|'krampus'|'kills' $board */
        $board = $request->string('board')->value();
        /** @var 'week'|'all' $period */
        $period = $request->string('period')->value();

        return response()->json(Leaderboard::for($board, $period, $request->user()));
    }
}
