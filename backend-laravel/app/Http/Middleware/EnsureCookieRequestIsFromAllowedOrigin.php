<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCookieRequestIsFromAllowedOrigin
{
    /** @var array<int, string> */
    private const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

    public function handle(Request $request, Closure $next): Response
    {
        if (in_array($request->method(), self::SAFE_METHODS, true)
            || $request->attributes->get('daemon_auth_via_cookie') !== true) {
            return $next($request);
        }

        $origin = $this->requestOrigin($request);
        $allowed = array_map(
            static fn (string $value): string => rtrim($value, '/'),
            array_filter(config('cors.allowed_origins', []), 'is_string'),
        );

        if ($origin === null || ! in_array(rtrim($origin, '/'), $allowed, true)) {
            return new JsonResponse([
                'message' => 'Origen de solicitud no permitido.',
            ], 419);
        }

        return $next($request);
    }

    private function requestOrigin(Request $request): ?string
    {
        $origin = trim((string) $request->headers->get('Origin'));

        if ($origin !== '' && $origin !== 'null') {
            return $origin;
        }

        $referer = trim((string) $request->headers->get('Referer'));
        if ($referer === '') {
            return null;
        }

        $parts = parse_url($referer);
        if (! is_array($parts) || ! isset($parts['scheme'], $parts['host'])) {
            return null;
        }

        $port = isset($parts['port']) ? ':'.$parts['port'] : '';

        return $parts['scheme'].'://'.$parts['host'].$port;
    }
}
