<?php

namespace App\Http\Controllers\SilentNight;

use App\Actions\SilentNight\RecordRun;
use App\Http\Controllers\Controller;
use App\Http\Requests\SilentNight\RecordRunRequest;
use App\Http\Resources\SilentNightProgressResource;
use Illuminate\Http\JsonResponse;

/**
 * A finished night of Silent Night, kept for the leaderboards: answers with the coal it earned,
 * and the player's progress with it banked.
 */
class RecordRunHandler extends Controller
{
    public function __invoke(RecordRun $recordRun, RecordRunRequest $request): JsonResponse
    {
        $result = $recordRun($request->user(), [
            'seconds' => $request->integer('seconds'),
            'kills' => $request->integer('kills'),
            'level' => $request->integer('level'),
            'bargains' => $request->integer('bargains'),
            'won' => $request->boolean('won'),
            'bosses' => $request->integer('bosses'),
            'coal_found' => $request->integer('coal_found'),
        ]);

        return response()->json([
            'coal_earned' => $result['coal_earned'],
            'progress' => new SilentNightProgressResource($result['progress']),
        ]);
    }
}
