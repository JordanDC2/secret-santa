<?php

use App\Http\Controllers\Auth\LoginHandler;
use App\Http\Controllers\Auth\LogoutHandler;
use App\Http\Controllers\Auth\RegisterHandler;
use App\Http\Controllers\Group\DrawHandler;
use App\Http\Controllers\Group\JoinHandler;
use App\Http\Controllers\GroupController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->name('auth.')->group(function () {
    Route::post('register', RegisterHandler::class)->name('register');

    Route::post('login', LoginHandler::class)->name('login');

    Route::post('logout', LogoutHandler::class)
        ->middleware('auth:sanctum')
        ->name('logout');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('groups/join', JoinHandler::class)->name('groups.join');

    Route::post('groups/{group}/draw', DrawHandler::class)->name('groups.draw');

    Route::apiResource('groups', GroupController::class)->only(['index', 'store', 'show']);
});
