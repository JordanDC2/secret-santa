<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Support\Geo\IpLocator;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Notes roughly where a signed-in person is using the app from (country and state), at most
 * once a day, for the admin page's map. Their internet address itself isn't stored here.
 */
class RecordRegion
{
    private const CHECK_EVERY_HOURS = 24;

    public function __construct(private readonly IpLocator $locator) {}

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // After the request, so the route's auth middleware has worked out who it is.
        $user = $request->user();

        if ($user instanceof User && ! $user->isManagedProfile() && $this->due($user)) {
            $place = $this->locator->locate((string) $request->ip());
            $changes = ['region_checked_at' => now()];

            if ($place !== null) {
                $changes += ['region_country' => $place['country'], 'region_name' => $place['region']];
            }

            // Straight to the table: this isn't an edit, so it shouldn't touch updated_at.
            User::whereKey($user->id)->toBase()->update($changes);
            $user->forceFill($changes)->syncOriginalAttributes(array_keys($changes));
        }

        return $response;
    }

    private function due(User $user): bool
    {
        $checkedAt = $user->region_checked_at;

        return $checkedAt === null || $checkedAt->lt(now()->subHours(self::CHECK_EVERY_HOURS));
    }
}
