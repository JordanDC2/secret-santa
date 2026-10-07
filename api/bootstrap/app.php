<?php

use App\Http\Controllers\Group\InvitePageHandler;
use App\Http\Middleware\RecordRegion;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        // Invite links' page (link-preview tags naming the group). No web middleware: it's a
        // public page, so preview bots don't create sessions.
        then: function () {
            Route::get('join/{code}', InvitePageHandler::class)->name('invites.page');
        },
    )
    // Channel auth lives at /api/broadcasting/auth behind Sanctum, so the React app's
    // session cookie authorizes private channels the same way it does API calls.
    ->withBroadcasting(
        __DIR__.'/../routes/channels.php',
        ['prefix' => 'api', 'middleware' => ['api', 'auth:sanctum']],
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();

        // Roughly where signed-in people are, for the admin page's map (once a day each).
        $middleware->api(append: [RecordRegion::class]);

        // This server only has the API: signed-out requests get a 401, never a redirect to a
        // "login" route that lives in the React app (that crashed with a 500 before).
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
