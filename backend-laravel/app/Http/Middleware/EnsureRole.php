<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $usuario = $request->user();

        abort_unless($usuario && in_array($usuario->rol, $roles, true), 403, 'No tienes permisos para acceder a este recurso.');

        return $next($request);
    }
}
