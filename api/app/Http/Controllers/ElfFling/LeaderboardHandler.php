<?php

namespace App\Http\Controllers\ElfFling;

use App\Http\Controllers\Controller;
use App\Http\Requests\ElfFling\LeaderboardRequest;
use App\Support\ElfFling\Leaderboard;
use Illuminate\Http\JsonResponse;

/**
 * A leaderboard across everyone: Elf Fling's best distance, best score, most coins or most swings,
 * or pinball's best score, this week or all time.
 */
class LeaderboardHandler extends Controller
{
    public function __invoke(LeaderboardRequest $request): JsonResponse
    {
        /** @var 'distance'|'score'|'coins'|'swings'|'pinball' $board */
        $board = $request->string('board')->value();
        /** @var 'week'|'all' $period */
        $period = $request->string('period')->value();

        return response()->json(Leaderboard::for($board, $period, $request->user()));
    }
}
