<?php

namespace App\Http\Controllers\ElfFling;

use App\Actions\ElfFling\RecordThrow;
use App\Http\Controllers\Controller;
use App\Http\Requests\ElfFling\RecordThrowRequest;
use App\Http\Resources\ElfFlingProgressResource;
use Illuminate\Http\JsonResponse;

/**
 * A finished throw: banks its coins and puts it on the leaderboards.
 */
class ThrowHandler extends Controller
{
    public function __invoke(RecordThrow $recordThrow, RecordThrowRequest $request): JsonResponse
    {
        $result = $recordThrow($request->user(), $request->float('distance'), $request->integer('coins_collected'));

        return response()->json([
            'progress' => new ElfFlingProgressResource($result['progress']),
            'banked' => $result['banked'],
            'new_best' => $result['newBest'],
        ]);
    }
}
