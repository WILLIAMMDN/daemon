<?php

namespace Tests\Unit;

use App\Http\Middleware\EnsureCookieRequestIsFromAllowedOrigin;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class CookieOriginMiddlewareTest extends TestCase
{
    public function test_allows_mutation_from_configured_origin(): void
    {
        config(['cors.allowed_origins' => ['https://daemonestudiante.web.app']]);
        $request = Request::create('/api/v1/auth/logout', 'POST', server: [
            'HTTP_ORIGIN' => 'https://daemonestudiante.web.app',
        ]);
        $request->attributes->set('daemon_auth_via_cookie', true);

        $response = (new EnsureCookieRequestIsFromAllowedOrigin)->handle(
            $request,
            fn (): Response => new Response('ok'),
        );

        $this->assertSame(200, $response->getStatusCode());
    }

    public function test_rejects_cookie_mutation_from_unknown_origin(): void
    {
        config(['cors.allowed_origins' => ['https://daemonestudiante.web.app']]);
        $request = Request::create('/api/v1/auth/logout', 'POST', server: [
            'HTTP_ORIGIN' => 'https://attacker.example',
        ]);
        $request->attributes->set('daemon_auth_via_cookie', true);

        $response = (new EnsureCookieRequestIsFromAllowedOrigin)->handle(
            $request,
            fn (): Response => new Response('unsafe'),
        );

        $this->assertSame(419, $response->getStatusCode());
    }

    public function test_explicit_bearer_clients_are_not_subject_to_browser_origin_check(): void
    {
        config(['cors.allowed_origins' => ['https://daemonestudiante.web.app']]);
        $request = Request::create('/api/v1/auth/logout', 'POST');

        $response = (new EnsureCookieRequestIsFromAllowedOrigin)->handle(
            $request,
            fn (): Response => new Response('ok'),
        );

        $this->assertSame(200, $response->getStatusCode());
    }
}
