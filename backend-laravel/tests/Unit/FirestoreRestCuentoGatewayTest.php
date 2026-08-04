<?php

namespace Tests\Unit;

use App\Services\Auth\GoogleServiceAccountTokenService;
use App\Services\Cuento\FirestoreRestCuentoGateway;
use Illuminate\Support\Facades\Http;
use Mockery;
use Tests\TestCase;

class FirestoreRestCuentoGatewayTest extends TestCase
{
    private function gateway(): FirestoreRestCuentoGateway
    {
        config(['services.firebase.project_id' => 'daemon-a41f8']);

        $google = Mockery::mock(GoogleServiceAccountTokenService::class);
        $google->shouldReceive('token')->andReturn('google-access-token');

        return new FirestoreRestCuentoGateway($google);
    }

    public function test_listar_parsea_respuesta_como_json_array_indentado(): void
    {
        Http::fake([
            'firestore.googleapis.com/*:runQuery' => Http::response(
                json_encode([
                    ['document' => [
                        'name' => 'projects/daemon-a41f8/databases/(default)/documents/cuentos/abc',
                        'fields' => ['estado' => ['stringValue' => 'publicado']],
                        'updateTime' => '2026-08-04T16:00:00.000000Z',
                    ]],
                    ['readTime' => '2026-08-04T16:00:00.000000Z'],
                ], JSON_PRETTY_PRINT),
                200,
            ),
        ]);

        $documentos = $this->gateway()->listar('cuentos', ['estado' => 'publicado']);

        $this->assertCount(1, $documentos);
        $this->assertSame('abc', basename($documentos[0]['name']));
        $this->assertSame('publicado', $documentos[0]['fields']['estado']);
    }

    public function test_listar_parsea_respuesta_ndjson_linea_por_linea(): void
    {
        Http::fake([
            'firestore.googleapis.com/*:runQuery' => Http::response(
                implode("\n", [
                    json_encode(['document' => [
                        'name' => 'projects/daemon-a41f8/databases/(default)/documents/cuentos/xyz',
                        'fields' => ['estado' => ['stringValue' => 'publicado']],
                        'updateTime' => '2026-08-04T16:00:00.000000Z',
                    ]]),
                    json_encode(['readTime' => '2026-08-04T16:00:00.000000Z']),
                ]),
                200,
            ),
        ]);

        $documentos = $this->gateway()->listar('cuentos', ['estado' => 'publicado']);

        $this->assertCount(1, $documentos);
        $this->assertSame('xyz', basename($documentos[0]['name']));
    }

    public function test_contar_parsea_agregado_como_json_array(): void
    {
        Http::fake([
            'firestore.googleapis.com/*:runAggregationQuery' => Http::response(
                json_encode([
                    ['result' => ['aggregateFields' => ['total' => ['integerValue' => '7']]]],
                ], JSON_PRETTY_PRINT),
                200,
            ),
        ]);

        $total = $this->gateway()->contar('cuentos/abc/reacciones');

        $this->assertSame(7, $total);
    }

    public function test_contar_parsea_agregado_como_ndjson(): void
    {
        Http::fake([
            'firestore.googleapis.com/*:runAggregationQuery' => Http::response(
                json_encode(['result' => ['aggregateFields' => ['total' => ['integerValue' => '3']]]]),
                200,
            ),
        ]);

        $total = $this->gateway()->contar('cuentos/abc/reacciones');

        $this->assertSame(3, $total);
    }
}
