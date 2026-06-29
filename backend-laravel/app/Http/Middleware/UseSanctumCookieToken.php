<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class UseSanctumCookieToken
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->bearerToken()) {
            $token = $this->decodeCookieToken($request->cookie((string) config('daemon.auth_cookie.name')));

            if ($token !== null) {
                $request->headers->set('Authorization', 'Bearer '.$token);
            }
        }

        return $next($request);
    }

    private function decodeCookieToken(mixed $value): ?string
    {
        if (! is_string($value) || $value === '') {
            return null;
        }

        $payload = strtr($value, '-_', '+/');
        $padding = strlen($payload) % 4;

        if ($padding > 0) {
            $payload .= str_repeat('=', 4 - $padding);
        }

        $decoded = base64_decode($payload, true);

        return is_string($decoded) && $decoded !== '' ? $decoded : null;
    }
}
