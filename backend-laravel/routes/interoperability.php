<?php

use App\Http\Controllers\Interoperabilidad\LtiLaunchController;
use App\Http\Controllers\Interoperabilidad\OneRosterController;
use App\Http\Controllers\Interoperabilidad\OneRosterTokenController;
use App\Services\Interoperabilidad\OneRosterAuthService;
use Illuminate\Support\Facades\Route;

Route::post('/ims/oneroster/oauth2/token', OneRosterTokenController::class)->middleware('throttle:20,1');
Route::get('/lti/login', [LtiLaunchController::class, 'login'])->middleware('throttle:30,1');
Route::post('/lti/launch', [LtiLaunchController::class, 'launch'])->middleware('throttle:30,1');

Route::prefix('/ims/oneroster/rostering/v1p2')
    ->middleware(['oneroster:'.OneRosterAuthService::SCOPE_ROSTER_READONLY, 'throttle:120,1'])
    ->group(function (): void {
        Route::get('/classes/{classSourcedId}/{tipo}', [OneRosterController::class, 'classUsers'])
            ->whereIn('tipo', ['students', 'teachers']);
        Route::get('/{tipo}/{sourcedId}', [OneRosterController::class, 'show']);
        Route::get('/{tipo}', [OneRosterController::class, 'index']);
    });
