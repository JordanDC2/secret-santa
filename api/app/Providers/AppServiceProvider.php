<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        JsonResource::withoutWrapping();

        $this->configureRateLimits();
    }

    /**
     * Brute-force protection for endpoints that guess at secrets (passwords, join codes)
     * or create accounts.
     */
    private function configureRateLimits(): void
    {
        // Per account+IP so one attacker can't lock everyone out, plus a per-IP ceiling.
        RateLimiter::for('login', fn (Request $request) => [
            Limit::perMinute(5)->by(strtolower((string) $request->input('email')).'|'.$request->ip()),
            Limit::perMinute(20)->by($request->ip()),
        ]);

        RateLimiter::for('register', fn (Request $request) => Limit::perHour(10)->by($request->ip()));

        // Join codes are 6 characters, so cap guesses per signed-in user.
        RateLimiter::for('join', fn (Request $request) => Limit::perMinute(10)->by($request->user()?->id ?: $request->ip()));

        // Each preview makes the server fetch an outside page, so keep it modest.
        RateLimiter::for('link-preview', fn (Request $request) => Limit::perMinute(20)->by($request->user()?->id ?: $request->ip()));
    }
}
