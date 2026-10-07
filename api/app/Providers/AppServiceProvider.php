<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

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

        // Every new password (sign-up, reset, change): 8+ characters, as NIST 800-63B advises
        // instead of "must include a symbol" rules, and at most 72, since bcrypt ignores the rest.
        // In production, also not one from a known data breach (Have I Been Pwned; only the
        // first 5 characters of its SHA-1 hash leave the server, and it lets passwords through
        // if the service is down). Not locally or in tests, so they make no outside calls.
        Password::defaults(function () {
            $rule = Password::min(8)->max(72);

            return $this->app->isProduction() ? $rule->uncompromised() : $rule;
        });

        // The admin page: only the site's owner (ADMIN_EMAIL).
        Gate::define('admin', fn (User $user) => $user->is_admin);

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
        // Each first unread message sends an email, so keep a chatty thread from turning into spam.
        RateLimiter::for('santa-chat', fn (Request $request) => Limit::perMinute(10)->by($request->user()?->id ?: $request->ip()));

        RateLimiter::for('link-preview', fn (Request $request) => Limit::perMinute(20)->by($request->user()?->id ?: $request->ip()));
    }
}
