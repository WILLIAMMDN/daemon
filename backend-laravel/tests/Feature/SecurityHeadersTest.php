<?php

namespace Tests\Feature;

use Tests\TestCase;

class SecurityHeadersTest extends TestCase
{
    public function test_api_responses_include_basic_security_headers(): void
    {
        config(['services.firebase.project_id' => 'daemon-test']);

        $response = $this->getJson('/api/v1/salud');

        $response->assertOk();
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'DENY');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
        $response->assertJsonStructure(['ok', 'version', 'commit', 'database', 'authentication', 'assets', 'checked_at']);
        $response->assertJsonPath('authentication.firebase_project_configured', true);
    }
}
