<?php

namespace App\Http\Controllers\SilentNight;

use App\Actions\SilentNight\Buy;
use App\Http\Controllers\Controller;
use App\Http\Requests\SilentNight\BuyRequest;
use App\Http\Requests\SilentNight\ChooseCharacterRequest;
use App\Http\Resources\SilentNightProgressResource;
use App\Models\SilentNightProgress;
use Illuminate\Http\Request;

/**
 * The signed-in player's Silent Night progress: seeing it, buying in the Coal Cellar, and
 * choosing who to play as.
 */
class ProgressController extends Controller
{
    public function show(Request $request): SilentNightProgressResource
    {
        return new SilentNightProgressResource(SilentNightProgress::for($request->user()));
    }

    public function buy(Buy $buy, BuyRequest $request): SilentNightProgressResource
    {
        /** @var 'cellar'|'patron'|'cast' $kind */
        $kind = $request->string('kind')->value();

        return new SilentNightProgressResource($buy($request->user(), $kind, $request->string('item')->value()));
    }

    public function choose(ChooseCharacterRequest $request): SilentNightProgressResource
    {
        $progress = SilentNightProgress::for($request->user());
        $progress->update(['character' => $request->string('character')->value()]);

        return new SilentNightProgressResource($progress);
    }
}
