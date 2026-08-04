<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Tests del endpoint POST /api/v1/auth/firebase-token.
 *
 * @deprecated 2026-08-04 El token ahora viaja en la respuesta de
 *   /api/v1/auth/login (campo `firebase_token`, ver PR #66). Este
 *   endpoint se conserva por compatibilidad con clientes externos.
 *   Se mantiene la suite minima para no perder la cobertura del
 *   contrato 401 JSON que ya valida el QA.
 */
class FirebaseTokenEndpointTest extends TestCase
{
    public function test_endpoint_sin_sesion_responde_401_json_con_accept_header(): void
    {
        $this->postJson('/api/v1/auth/firebase-token')
            ->assertStatus(401)
            ->assertJson(['message' => 'Unauthenticated.']);
    }

    public function test_endpoint_sin_sesion_responde_401_json_sin_accept_header(): void
    {
        // Clientes que no envian Accept: application/json (p.ej. curl o
        // probes) antes recibian 500 porque Laravel intentaba redirigir a
        // route('login'), que no existe en esta SPA. El contrato es 401 JSON.
        $respuesta = $this->withHeaders(['Accept' => '*/*'])
            ->post('/api/v1/auth/firebase-token');

        $respuesta->assertStatus(401);
        $respuesta->assertJson(['message' => 'Unauthenticated.']);
    }
}
