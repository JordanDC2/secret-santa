<?php

use App\Http\Controllers\Account\DeleteAccountHandler;
use App\Http\Controllers\Account\UpdatePasswordHandler;
use App\Http\Controllers\Account\UpdateProfileHandler;
use App\Http\Controllers\Auth\ForgotPasswordHandler;
use App\Http\Controllers\Auth\LoginHandler;
use App\Http\Controllers\Auth\LogoutHandler;
use App\Http\Controllers\Auth\RegisterHandler;
use App\Http\Controllers\Auth\ResetPasswordHandler;
use App\Http\Controllers\Group\DrawHandler;
use App\Http\Controllers\Group\ExclusionController;
use App\Http\Controllers\Group\JoinHandler;
use App\Http\Controllers\Group\LeaveHandler;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\Wishlist\ClaimHandler;
use App\Http\Controllers\Wishlist\MemberWishlistHandler;
use App\Http\Controllers\Wishlist\UnclaimHandler;
use App\Http\Controllers\WishlistItemController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->name('auth.')->group(function () {
    Route::post('register', RegisterHandler::class)->name('register');

    Route::post('login', LoginHandler::class)->name('login');

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

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::prefix('account')->name('account.')->group(function () {
        Route::patch('profile', UpdateProfileHandler::class)->name('profile');

        Route::put('password', UpdatePasswordHandler::class)->name('password');

        Route::delete('/', DeleteAccountHandler::class)->name('destroy');
    });

    Route::post('groups/join', JoinHandler::class)->name('groups.join');

    Route::post('groups/{group}/draw', DrawHandler::class)->name('groups.draw');

    Route::post('groups/{group}/leave', LeaveHandler::class)->name('groups.leave');

    // scoped(): an exclusion id only resolves inside the group in the URL.
    Route::apiResource('groups.exclusions', ExclusionController::class)
        ->only(['index', 'store', 'destroy'])
        ->scoped();

    Route::prefix('wishlist')->name('wishlist.')->group(function () {
        Route::apiResource('items', WishlistItemController::class)->except('show');

        Route::post('items/{item}/claim', ClaimHandler::class)->name('items.claim');

        Route::delete('items/{item}/claim', UnclaimHandler::class)->name('items.unclaim');
    });

    Route::get('users/{user}/wishlist', MemberWishlistHandler::class)->name('users.wishlist');

    Route::apiResource('groups', GroupController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
});
