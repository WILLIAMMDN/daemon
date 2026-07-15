<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('sanctum:prune-expired --hours=24')
    ->dailyAt('03:15')
    ->withoutOverlapping();

Schedule::command('queue:prune-failed --hours=168')
    ->dailyAt('03:30')
    ->withoutOverlapping();

Schedule::command('daemon:aplicar-retencion --confirm')
    ->weeklyOn(1, '04:00')
    ->withoutOverlapping();
