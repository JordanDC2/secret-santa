<?php

namespace App\Http\Controllers\ElfFling;

use App\Actions\ElfFling\ImportDeviceProgress;
use App\Http\Controllers\Controller;
use App\Http\Requests\ElfFling\ImportProgressRequest;
use App\Http\Resources\ElfFlingProgressResource;

/**
 * Brings over the progress a browser saved before accounts kept it (once per player).
 */
class ImportHandler extends Controller
{
    public function __invoke(ImportDeviceProgress $import, ImportProgressRequest $request): ElfFlingProgressResource
    {
        return new ElfFlingProgressResource($import($request->user(), $request->device()));
    }
}
