<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;

Route::view('/', 'welcome');

Route::get('/run-migrations', function () {
    Artisan::call('migrate', ['--force' => true]);
    return 'Migraciones ejecutadas exitosamente. ' . Artisan::output();
});
