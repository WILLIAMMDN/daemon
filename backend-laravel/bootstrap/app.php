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

        // API-first: los guests de /api/* nunca se redirigen a route('login')
        // (esa ruta no existe en esta SPA y route() lanza RouteNotFoundException
        // dentro del middleware, antes de la AuthenticationException). Al
        // devolver null se lanza la excepcion y shouldRenderJsonWhen responde
        // 401 JSON sin depender del header Accept.
        $middleware->redirectGuestsTo(
            static fn ($request): ?string => $request->is('api/*') ? null : route('login'),
        );
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // API-first: las rutas /api/* deben responder JSON aunque la peticion
        // no mande Accept: application/json. Sin esto, una AuthenticationException
        // intenta redirigir a route('login') (que no existe en una SPA) y devuelve
        // 500 en vez de 401 para clientes sin header Accept.
        $exceptions->shouldRenderJsonWhen(
            static fn ($request, $e): bool => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
