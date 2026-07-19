<?php

namespace App\Http\Middleware;

use App\Models\TokenOneRoster;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOneRosterToken
{
    public function handle(Request $request, Closure $next, string ...$scopes): Response
    {
        $plainToken = $request->bearerToken();
        if (! $plainToken) {
            return $this->unauthorized('Falta el token Bearer.');
        }

        $token = TokenOneRoster::query()
            ->with('cliente')
            ->where('token_hash', hash('sha256', $plainToken))
            ->whereNull('revocado_at')
            ->where('expira_at', '>', now())
            ->first();

        if (! $token || ! $token->cliente?->activo) {
            return $this->unauthorized('Token inválido o vencido.');
        }

        $concedidos = $token->scopes ?? [];
        foreach ($scopes as $scope) {
            if (! in_array($scope, $concedidos, true)) {
                return response()->json([
                    'error' => 'insufficient_scope',
                    'error_description' => 'El cliente no tiene el alcance requerido.',
                ], 403);
            }
        }

        $request->attributes->set('oneroster_client', $token->cliente);
        $request->attributes->set('oneroster_scopes', $concedidos);
        $token->cliente->forceFill(['ultimo_uso_at' => now()])->save();

        return $next($request);
    }

    private function unauthorized(string $descripcion): JsonResponse
    {
        return response()->json([
            'error' => 'invalid_token',
            'error_description' => $descripcion,
        ], 401, ['WWW-Authenticate' => 'Bearer']);
    }
}
