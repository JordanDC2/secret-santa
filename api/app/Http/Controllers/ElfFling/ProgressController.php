<?php

namespace App\Http\Controllers\ElfFling;

use App\Http\Controllers\Controller;
use App\Http\Requests\ElfFling\UpdateLooksRequest;
use App\Http\Resources\ElfFlingProgressResource;
use App\Models\ElfFlingProgress;
use Illuminate\Http\Request;

/**
 * The signed-in player's Elf Fling progress, and which looks they're using.
 */
class ProgressController extends Controller
{
    public function show(Request $request): ElfFlingProgressResource
    {
        return new ElfFlingProgressResource(ElfFlingProgress::for($request->user()));
    }

    public function updateLooks(UpdateLooksRequest $request): ElfFlingProgressResource
    {
        $progress = ElfFlingProgress::for($request->user());
        $progress->update($request->safe()->only('skin', 'batter'));

        return new ElfFlingProgressResource($progress);
    }
}
