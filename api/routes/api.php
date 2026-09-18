<?php

use App\Http\Controllers\Auth\LoginHandler;
use App\Http\Controllers\Auth\LogoutHandler;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->name('auth.')->group(function () {
    Route::post('login', LoginHandler::class)->name('login');

    Route::post('logout', LogoutHandler::class)
        ->middleware('auth:sanctum')
        ->name('logout');
});

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
