<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\TransientToken;
use Symfony\Component\HttpFoundation\Response;

/**
 * Exige alcances explícitos en el token de la petición.
 *
 * Una sesión interactiva (cookie/token de navegador con `*`) pasa igual que
 * antes: el rol sigue siendo la autoridad. Un token de servicio headless sólo
 * pasa si declara el alcance requerido, y la comprobación vive en el servidor,
 * no en el cliente que lo consume.
 */
class EnsureTokenAbility
{
    public function handle(Request $request, Closure $next, string ...$alcances): Response
    {
        $usuario = $request->user();
        abort_unless($usuario !== null, 401, 'Autenticación requerida.');

        $token = method_exists($usuario, 'currentAccessToken') ? $usuario->currentAccessToken() : null;

        // Sesión interactiva: no hay alcances que comprobar.
        if ($token === null || $token instanceof TransientToken) {
            return $next($request);
        }

        foreach ($alcances as $alcance) {
            abort_unless(
                $usuario->tokenCan($alcance),
                403,
                "El token no declara el alcance requerido: {$alcance}.",
            );
        }

        return $next($request);
    }
}
