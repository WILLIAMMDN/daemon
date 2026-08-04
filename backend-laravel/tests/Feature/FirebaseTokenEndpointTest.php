<?php

namespace Tests\Feature;

use Tests\TestCase;

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
