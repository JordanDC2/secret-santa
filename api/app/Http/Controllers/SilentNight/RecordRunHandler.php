<?php

namespace App\Http\Controllers\SilentNight;

use App\Actions\SilentNight\RecordRun;
use App\Http\Controllers\Controller;
use App\Http\Requests\SilentNight\RecordRunRequest;
use Illuminate\Http\Response;

/**
 * A finished night of Silent Night, kept for the leaderboards.
 */
class RecordRunHandler extends Controller
{
    public function __invoke(RecordRun $recordRun, RecordRunRequest $request): Response
    {
        $recordRun($request->user(), [
            'seconds' => $request->integer('seconds'),
            'kills' => $request->integer('kills'),
            'level' => $request->integer('level'),
            'bargains' => $request->integer('bargains'),
            'won' => $request->boolean('won'),
        ]);

        return response()->noContent();
    }
}
