<?php

namespace App\Http\Controllers\Wishlist;

use App\Http\Controllers\Controller;
use App\Support\LinkPreview\LinkPreviewFetcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Reads a pasted product link so the add-item form can fill in empty fields. Always answers
 * 200: a page we can't read just comes back with nothing filled in.
 */
class LinkPreviewHandler extends Controller
{
    public function __invoke(LinkPreviewFetcher $fetcher, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'url' => ['required', 'url:http,https', 'max:2048'],
        ]);

        return response()->json($fetcher->fetch($validated['url']));
    }
}
