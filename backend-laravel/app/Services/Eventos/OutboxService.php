<?php

namespace App\Services\Eventos;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OutboxService
{
    public function registrar(string $tipo, string $agregadoTipo, string|int $agregadoId, array $payload): void
    {
        DB::table('eventos_dominio')->insert([
            'uuid' => (string) Str::uuid(),
            'tipo' => $tipo,
            'agregado_tipo' => $agregadoTipo,
            'agregado_id' => (string) $agregadoId,
            'payload' => json_encode($payload, JSON_THROW_ON_ERROR),
            'ocurrido_at' => now(),
            'created_at' => now(),
        ]);
    }
}
