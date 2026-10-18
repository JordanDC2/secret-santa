<?php

namespace App\Http\Controllers\ElfFling;

use App\Actions\ElfFling\Prestige;
use App\Http\Controllers\Controller;
use App\Http\Resources\ElfFlingProgressResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Wraps up this Christmas: spare coins become gems and the coin shop starts over.
 */
class PrestigeHandler extends Controller
{
    public function __invoke(Prestige $prestige, Request $request): JsonResponse
    {
        $result = $prestige($request->user());

        return response()->json([
            'progress' => new ElfFlingProgressResource($result['progress']),
            'gems' => $result['gems'],
        ]);
    }
}
