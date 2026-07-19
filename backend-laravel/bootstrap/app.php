<?php

use App\Http\Middleware\EnsureCookieRequestIsFromAllowedOrigin;
use App\Http\Middleware\EnsureOneRosterToken;
use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\RequestCorrelationId;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\UseSanctumCookieToken;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
        then: function (): void {
            Route::middleware('api')->group(base_path('routes/interoperability.php'));
        },
    )
    ->withCommands([
        __DIR__.'/../app/Console/Commands',
    ])
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(
            prepend: [UseSanctumCookieToken::class],
            append: [RequestCorrelationId::class, SecurityHeaders::class, EnsureCookieRequestIsFromAllowedOrigin::class],
        );

        $middleware->alias([
            'role' => EnsureRole::class,
            'oneroster' => EnsureOneRosterToken::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
