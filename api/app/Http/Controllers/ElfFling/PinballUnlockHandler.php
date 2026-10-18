<?php

namespace App\Http\Controllers\ElfFling;

use App\Actions\ElfFling\UnlockPinball;
use App\Http\Controllers\Controller;
use App\Http\Resources\ElfFlingProgressResource;
use Illuminate\Http\Request;

/**
 * The player found Elf Fling's chimney, unlocking Christmas pinball as a game of its own.
 */
class PinballUnlockHandler extends Controller
{
    public function __invoke(UnlockPinball $unlockPinball, Request $request): ElfFlingProgressResource
    {
        return new ElfFlingProgressResource($unlockPinball($request->user()));
    }
}
