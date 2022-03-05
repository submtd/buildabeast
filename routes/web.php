<?php

use Illuminate\Support\Facades\Route;

Route::group([
    'namespace' => 'App\Http\Controllers',
], static function () {
    Route::get('/', 'Home')->name('login');
    Route::post('address', 'UpdateAddress');
    Route::post('login', 'Login');
    Route::get('session', 'Session');
    Route::post('session', 'UpdateSession');
    Route::group([
        'middleware' => 'auth',
    ], static function () {
        Route::post('logout', 'Logout');
        Route::get('me', 'Me');
    });
});
