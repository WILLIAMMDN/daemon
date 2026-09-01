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

    public function registrarIdempotente(
        string $clave,
        string $tipo,
        string $agregadoTipo,
        string|int $agregadoId,
        array $payload,
        ?int $alumnoId = null,
        ?int $matriculaId = null,
        ?int $versionCursoId = null,
    ): bool {
        return DB::table('eventos_dominio')->insertOrIgnore([
            'uuid' => (string) Str::uuid(),
            'clave_idempotencia' => $clave,
            'tipo' => $tipo,
            'agregado_tipo' => $agregadoTipo,
            'agregado_id' => (string) $agregadoId,
            'id_alumno' => $alumnoId,
            'id_matricula' => $matriculaId,
            'id_version_curso' => $versionCursoId,
            'payload' => json_encode($payload, JSON_THROW_ON_ERROR),
            'ocurrido_at' => now(),
            'created_at' => now(),
        ]) === 1;
    }
}
