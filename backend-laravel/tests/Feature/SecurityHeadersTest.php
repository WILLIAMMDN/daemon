<?php

namespace Tests\Feature;

use Tests\TestCase;

class SecurityHeadersTest extends TestCase
{
    public function test_api_responses_include_basic_security_headers(): void
    {
        $response = $this->getJson('/api/v1/salud');

        $response->assertOk();
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'DENY');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
        $response->assertJsonStructure(['ok', 'version', 'commit', 'database', 'assets', 'checked_at']);
    }
}
