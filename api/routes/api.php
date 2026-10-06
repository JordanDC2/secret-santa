<?php

use App\Http\Controllers\Account\DeleteAccountHandler;
use App\Http\Controllers\Account\EmailPreferencesController;
use App\Http\Controllers\Account\UpdatePasswordHandler;
use App\Http\Controllers\Account\UpdateProfileHandler;
use App\Http\Controllers\Auth\ForgotPasswordHandler;
use App\Http\Controllers\Auth\LoginHandler;
use App\Http\Controllers\Auth\LogoutHandler;
use App\Http\Controllers\Auth\RegisterHandler;
use App\Http\Controllers\Auth\ResetPasswordHandler;
use App\Http\Controllers\Group\DrawDetailsController;
use App\Http\Controllers\Group\DrawHandler;
use App\Http\Controllers\Group\ExclusionController;
use App\Http\Controllers\Group\InvitePreviewHandler;
use App\Http\Controllers\Group\JoinHandler;
use App\Http\Controllers\Group\LeaveHandler;
use App\Http\Controllers\Group\StartNewDrawHandler;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\SantaChat\SantaChatController;
use App\Http\Controllers\Wishlist\ClaimHandler;
use App\Http\Controllers\Wishlist\LinkPreviewHandler;
use App\Http\Controllers\Wishlist\MemberWishlistHandler;
use App\Http\Controllers\Wishlist\NudgeClaimHandler;
use App\Http\Controllers\Wishlist\PurchasedHandler;
use App\Http\Controllers\Wishlist\ReceivedHandler;
use App\Http\Controllers\Wishlist\SuggestionHandler;
use App\Http\Controllers\Wishlist\UnclaimHandler;
use App\Http\Controllers\WishlistItemController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->name('auth.')->group(function () {
    Route::post('register', RegisterHandler::class)->middleware('throttle:register')->name('register');

    Route::post('login', LoginHandler::class)->middleware('throttle:login')->name('login');

    Route::post('forgot-password', ForgotPasswordHandler::class)
        ->middleware('throttle:6,1')
        ->name('password.email');

    Route::post('reset-password', ResetPasswordHandler::class)
        ->middleware('throttle:6,1')
        ->name('password.update');

    Route::post('logout', LogoutHandler::class)
        ->middleware('auth:sanctum')
        ->name('logout');
});

// Public: an invite link shows which group it's for before the visitor signs in.
Route::get('invites/{code}', InvitePreviewHandler::class)->middleware('throttle:join')->name('invites.show');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::prefix('account')->name('account.')->group(function () {
        Route::patch('profile', UpdateProfileHandler::class)->name('profile');

        Route::put('password', UpdatePasswordHandler::class)->name('password');

        Route::get('email-preferences', [EmailPreferencesController::class, 'show'])->name('email-preferences.show');

        Route::patch('email-preferences', [EmailPreferencesController::class, 'update'])->name('email-preferences.update');

        Route::delete('/', DeleteAccountHandler::class)->name('destroy');
    });

    Route::post('groups/join', JoinHandler::class)->middleware('throttle:join')->name('groups.join');

    Route::post('groups/{group}/draw', DrawHandler::class)->name('groups.draw');

    Route::post('groups/{group}/new-draw', StartNewDrawHandler::class)->name('groups.new-draw');

    Route::post('groups/{group}/leave', LeaveHandler::class)->name('groups.leave');

    Route::get('groups/{group}/draw/check', [DrawDetailsController::class, 'check'])->name('groups.draw.check');

    Route::get('groups/{group}/draw/assignments', [DrawDetailsController::class, 'assignments'])->name('groups.draw.assignments');

    Route::prefix('groups/{group}/santa-chat/{side}')
        ->name('groups.santa-chat.')
        ->whereIn('side', ['my-person', 'my-santa'])
        ->controller(SantaChatController::class)
        ->group(function () {
            Route::get('/', 'show')->name('show');

            Route::post('/', 'store')->middleware('throttle:santa-chat')->name('store');

            Route::post('read', 'read')->name('read');
        });

    // scoped(): an exclusion id only resolves inside the group in the URL.
    Route::apiResource('groups.exclusions', ExclusionController::class)
        ->only(['index', 'store', 'destroy'])
        ->scoped();

    Route::prefix('wishlist')->name('wishlist.')->group(function () {
        Route::apiResource('items', WishlistItemController::class)->except('show');

        Route::post('items/{item}/claim', ClaimHandler::class)->name('items.claim');

        Route::post('link-preview', LinkPreviewHandler::class)->middleware('throttle:link-preview')->name('link-preview');

        Route::delete('items/{item}/claim', UnclaimHandler::class)->name('items.unclaim');

        Route::post('items/{item}/claim/purchased', [PurchasedHandler::class, 'store'])->name('items.claim.purchased');

        Route::delete('items/{item}/claim/purchased', [PurchasedHandler::class, 'destroy'])->name('items.claim.unpurchased');

        Route::post('claims/{claim}/nudge', NudgeClaimHandler::class)->name('claims.nudge');

        Route::post('items/{item}/received', [ReceivedHandler::class, 'store'])->name('items.received');

        Route::delete('items/{item}/received', [ReceivedHandler::class, 'destroy'])->name('items.unreceived');
    });

    Route::get('users/{user}/wishlist', MemberWishlistHandler::class)->name('users.wishlist');

    Route::post('users/{user}/wishlist/suggestions', SuggestionHandler::class)->name('wishlist.suggestions.store');

    Route::apiResource('groups', GroupController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
});
