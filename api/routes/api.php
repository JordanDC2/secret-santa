<?php

use App\Http\Controllers\Account\DeleteAccountHandler;
use App\Http\Controllers\Account\EmailPreferencesController;
use App\Http\Controllers\Account\ManagedProfileController;
use App\Http\Controllers\Account\PushPreferencesController;
use App\Http\Controllers\Account\PushSubscriptionController;
use App\Http\Controllers\Account\UpdatePasswordHandler;
use App\Http\Controllers\Account\UpdateProfileHandler;
use App\Http\Controllers\Admin\AccountController as AdminAccountController;
use App\Http\Controllers\Admin\FailedJobController;
use App\Http\Controllers\Admin\GroupController as AdminGroupController;
use App\Http\Controllers\Admin\LocationsHandler;
use App\Http\Controllers\Admin\OverviewHandler;
use App\Http\Controllers\Admin\SendPasswordResetHandler;
use App\Http\Controllers\Auth\ForgotPasswordHandler;
use App\Http\Controllers\Auth\GoogleLoginHandler;
use App\Http\Controllers\Auth\LoginHandler;
use App\Http\Controllers\Auth\LogoutHandler;
use App\Http\Controllers\Auth\RegisterHandler;
use App\Http\Controllers\Auth\ResendVerificationHandler;
use App\Http\Controllers\Auth\ResetPasswordHandler;
use App\Http\Controllers\Auth\VerifyEmailHandler;
use App\Http\Controllers\ElfFling\ImportHandler as ElfFlingImportHandler;
use App\Http\Controllers\ElfFling\LeaderboardHandler as ElfFlingLeaderboardHandler;
use App\Http\Controllers\ElfFling\PinballScoreHandler as ElfFlingPinballScoreHandler;
use App\Http\Controllers\ElfFling\PinballUnlockHandler as ElfFlingPinballUnlockHandler;
use App\Http\Controllers\ElfFling\PrestigeHandler as ElfFlingPrestigeHandler;
use App\Http\Controllers\ElfFling\ProgressController as ElfFlingProgressController;
use App\Http\Controllers\ElfFling\PurchaseHandler as ElfFlingPurchaseHandler;
use App\Http\Controllers\ElfFling\ThrowHandler as ElfFlingThrowHandler;
use App\Http\Controllers\Group\DrawDetailsController;
use App\Http\Controllers\Group\DrawEveryoneHandler;
use App\Http\Controllers\Group\DrawHandler;
use App\Http\Controllers\Group\DrawParticipantHandler;
use App\Http\Controllers\Group\ExclusionController;
use App\Http\Controllers\Group\GroupProfilesController;
use App\Http\Controllers\Group\InvitePreviewHandler;
use App\Http\Controllers\Group\JoinHandler;
use App\Http\Controllers\Group\LeaveHandler;
use App\Http\Controllers\Group\StartNewDrawHandler;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\SantaChat\SantaChatController;
use App\Http\Controllers\SilentNight\LeaderboardHandler as SilentNightLeaderboardHandler;
use App\Http\Controllers\SilentNight\RecordRunHandler as SilentNightRecordRunHandler;
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

    // "Continue with Google": logs in, or creates the account on first use.
    Route::post('google', GoogleLoginHandler::class)->middleware('throttle:google-login')->name('google');

    Route::post('forgot-password', ForgotPasswordHandler::class)
        ->middleware('throttle:6,1')
        ->name('password.email');

    Route::post('reset-password', ResetPasswordHandler::class)
        ->middleware('throttle:6,1')
        ->name('password.update');

    // The "Confirm my email" link: signed and expiring, so it works without being signed in.
    Route::get('email/verify/{user}/{hash}', VerifyEmailHandler::class)
        ->middleware('throttle:12,1')
        ->name('email.verify');

    Route::post('email/resend', ResendVerificationHandler::class)
        ->middleware(['auth:sanctum', 'throttle:3,10'])
        ->name('email.resend');

    Route::post('logout', LogoutHandler::class)
        ->middleware('auth:sanctum')
        ->name('logout');
});

// Who's signed in, if anyone: the React app asks on every page load. Answers null rather than
// 401 when signed out, so signed-out pages don't log a failed request in the console.
Route::get('session', fn (Request $request) => response()->json(['user' => $request->user()]))->name('session');

// Public: an invite link shows which group it's for before the visitor signs in.
Route::get('invites/{code}', InvitePreviewHandler::class)->middleware('throttle:join')->name('invites.show');

Route::middleware('auth:sanctum')->group(function () {
    // The site owner's admin page (ADMIN_EMAIL only).
    Route::prefix('admin')->name('admin.')->middleware('can:admin')->group(function () {
        Route::get('overview', OverviewHandler::class)->name('overview');

        Route::get('locations', LocationsHandler::class)->name('locations');

        Route::apiResource('accounts', AdminAccountController::class)->only(['index', 'update', 'destroy'])->parameters(['accounts' => 'user']);

        Route::post('accounts/{user}/password-reset', SendPasswordResetHandler::class)->name('accounts.password-reset');

        Route::apiResource('groups', AdminGroupController::class)->only(['index', 'destroy']);

        Route::post('failed-jobs/{uuid}/retry', [FailedJobController::class, 'retry'])->name('failed-jobs.retry');

        Route::delete('failed-jobs/{uuid}', [FailedJobController::class, 'destroy'])->name('failed-jobs.destroy');
    });

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::prefix('account')->name('account.')->group(function () {
        Route::patch('profile', UpdateProfileHandler::class)->name('profile');

        Route::put('password', UpdatePasswordHandler::class)->name('password');

        Route::get('email-preferences', [EmailPreferencesController::class, 'show'])->name('email-preferences.show');

        Route::patch('email-preferences', [EmailPreferencesController::class, 'update'])->name('email-preferences.update');

        Route::get('push-preferences', [PushPreferencesController::class, 'show'])->name('push-preferences.show');

        Route::patch('push-preferences', [PushPreferencesController::class, 'update'])->name('push-preferences.update');

        // This device's push address ("Allow notifications on this device").
        Route::post('push-subscriptions', [PushSubscriptionController::class, 'store'])->name('push-subscriptions.store');

        Route::delete('push-subscriptions', [PushSubscriptionController::class, 'destroy'])->name('push-subscriptions.destroy');

        // Kids and pets this user looks after.
        Route::apiResource('profiles', ManagedProfileController::class)->except('show')->parameters(['profiles' => 'profile']);

        // Co-parents: everyone who looks after a kid or pet.
        Route::post('profiles/{profile}/managers', [ManagedProfileController::class, 'addManager'])->name('profiles.managers.store');

        Route::delete('profiles/{profile}/managers/{manager}', [ManagedProfileController::class, 'removeManager'])->name('profiles.managers.destroy');

        Route::delete('/', DeleteAccountHandler::class)->name('destroy');
    });

    // Elf Fling: each player's progress and throws, and the site-wide leaderboards.
    Route::prefix('elf-fling')->name('elf-fling.')->group(function () {
        Route::get('progress', [ElfFlingProgressController::class, 'show'])->name('progress');

        Route::patch('progress/looks', [ElfFlingProgressController::class, 'updateLooks'])->name('looks');

        Route::post('progress/import', ElfFlingImportHandler::class)->name('import');

        Route::post('throws', ElfFlingThrowHandler::class)->middleware('throttle:elf-fling-throws')->name('throws');

        Route::post('purchases', ElfFlingPurchaseHandler::class)->name('purchases');

        Route::post('prestige', ElfFlingPrestigeHandler::class)->name('prestige');

        Route::post('pinball/unlock', ElfFlingPinballUnlockHandler::class)->name('pinball.unlock');

        Route::post('pinball/scores', ElfFlingPinballScoreHandler::class)->name('pinball.scores');

        Route::get('leaderboard', ElfFlingLeaderboardHandler::class)->name('leaderboard');
    });

    // Silent Night: each finished night, and the leaderboards.
    Route::prefix('silent-night')->name('silent-night.')->group(function () {
        Route::post('runs', SilentNightRecordRunHandler::class)->middleware('throttle:silent-night-runs')->name('runs');

        Route::get('leaderboard', SilentNightLeaderboardHandler::class)->name('leaderboard');
    });

    Route::post('groups/join', JoinHandler::class)->middleware('throttle:join')->name('groups.join');

    Route::post('groups/{group}/draw', DrawHandler::class)->name('groups.draw');

    Route::post('groups/{group}/new-draw', StartNewDrawHandler::class)->name('groups.new-draw');

    // The owner chooses who's in the draw; everyone is, until they say otherwise.
    Route::patch('groups/{group}/members/{member}/in-draw', DrawParticipantHandler::class)->name('groups.members.in-draw');

    Route::patch('groups/{group}/in-draw', DrawEveryoneHandler::class)->name('groups.in-draw');

    Route::post('groups/{group}/leave', LeaveHandler::class)->name('groups.leave');

    // Kids and pets you look after, in a group you're in.
    Route::post('groups/{group}/profiles', [GroupProfilesController::class, 'store'])->name('groups.profiles.store');

    Route::delete('groups/{group}/profiles/{profile}', [GroupProfilesController::class, 'destroy'])->name('groups.profiles.destroy');

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
