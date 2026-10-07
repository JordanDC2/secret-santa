<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Geo\IpLocator;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

/**
 * Where people use the app from, for the admin page's map: how many accounts per country and
 * per state or province. Counts only, never who.
 */
class LocationsHandler extends Controller
{
    public function __invoke(IpLocator $locator): JsonResponse
    {
        $accounts = User::whereNull('managed_kind');

        $countries = (clone $accounts)
            ->whereNotNull('region_country')
            ->selectRaw('region_country as country, count(*) as count')
            ->groupBy('region_country')
            ->orderByDesc('count')
            ->get()
            ->map(fn (User $row) => ['country' => (string) $row->getAttribute('country'), 'count' => (int) $row->getAttribute('count')]);

        $regions = (clone $accounts)
            ->whereNotNull('region_country')
            ->whereNotNull('region_name')
            ->selectRaw('region_country as country, region_name as region, count(*) as count')
            ->groupBy('region_country', 'region_name')
            ->orderByDesc('count')
            ->get()
            ->map(fn (User $row) => [
                'country' => (string) $row->getAttribute('country'),
                'region' => (string) $row->getAttribute('region'),
                'count' => (int) $row->getAttribute('count'),
            ]);

        $builtAt = $locator->builtAt();

        return response()->json([
            'countries' => $countries,
            'regions' => $regions,
            // Accounts not seen since the map was added, or only from home networks.
            'unknown' => (clone $accounts)->whereNull('region_country')->count(),
            // The location file's month, for the credit line; null until it's downloaded.
            'data_built_at' => $builtAt ? Carbon::createFromTimestamp($builtAt)->toIso8601String() : null,
        ]);
    }
}
