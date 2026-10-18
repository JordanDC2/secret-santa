<?php

namespace App\Http\Controllers\ElfFling;

use App\Actions\ElfFling\RecordPinballScore;
use App\Http\Controllers\Controller;
use App\Http\Requests\ElfFling\PinballScoreRequest;
use App\Http\Resources\ElfFlingProgressResource;

/**
 * A finished game of pinball, played on its own: the player's best is kept.
 */
class PinballScoreHandler extends Controller
{
    public function __invoke(RecordPinballScore $recordPinballScore, PinballScoreRequest $request): ElfFlingProgressResource
    {
        return new ElfFlingProgressResource($recordPinballScore($request->user(), $request->integer('score')));
    }
}
