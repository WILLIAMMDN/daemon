<?php

namespace Tests\Unit;

use App\Http\Middleware\UseSanctumCookieToken;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class AuthCookieTokenMiddlewareTest extends TestCase
{
    public function test_cookie_token_is_exposed_to_sanctum_as_bearer_token(): void
    {
        config(['daemon.auth_cookie.name' => 'daemon_access']);

        $token = '1|plain-sanctum-token';
        $cookie = rtrim(strtr(base64_encode($token), '+/', '-_'), '=');
        $request = Request::create('/api/v1/auth/yo', 'GET', [], ['daemon_access' => $cookie]);

        (new UseSanctumCookieToken)->handle($request, fn () => new Response);

        $this->assertSame($token, $request->bearerToken());
    }

    public function test_existing_bearer_header_wins_over_cookie_token(): void
    {
        config(['daemon.auth_cookie.name' => 'daemon_access']);

        $request = Request::create('/api/v1/auth/yo', 'GET', [], [
            'daemon_access' => rtrim(strtr(base64_encode('1|cookie-token'), '+/', '-_'), '='),
        ], [], [
            'HTTP_AUTHORIZATION' => 'Bearer 1|header-token',
        ]);

        (new UseSanctumCookieToken)->handle($request, fn () => new Response);

        $this->assertSame('1|header-token', $request->bearerToken());
    }
}
