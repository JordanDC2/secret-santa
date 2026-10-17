<?php

namespace App\Http\Controllers\ElfFling;

use App\Http\Controllers\Controller;
use App\Http\Requests\ElfFling\LeaderboardRequest;
use App\Support\ElfFling\Leaderboard;
use Illuminate\Http\JsonResponse;

/**
 * A leaderboard across everyone: best distance, most coins or most swings, this week or all time.
 */
class LeaderboardHandler extends Controller
{
    public function __invoke(LeaderboardRequest $request): JsonResponse
    {
        /** @var 'distance'|'coins'|'swings' $board */
        $board = $request->string('board')->value();
        /** @var 'week'|'all' $period */
        $period = $request->string('period')->value();

        return response()->json(Leaderboard::for($board, $period, $request->user()));
    }
}
