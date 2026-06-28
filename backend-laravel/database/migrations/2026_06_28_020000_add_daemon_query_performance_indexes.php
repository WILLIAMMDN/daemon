<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        foreach ($this->indices() as [$indice, $tabla, $columnas]) {
            DB::statement(sprintf(
                'create index if not exists "%s" on "%s" (%s)',
                str_replace('"', '""', $indice),
                str_replace('"', '""', $tabla),
                $columnas,
            ));
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        foreach ($this->indices() as [$indice]) {
            DB::statement(sprintf('drop index if exists "%s"', str_replace('"', '""', $indice)));
        }
    }

    /**
     * @return array<int, array{0: string, 1: string, 2: string}>
     */
    private function indices(): array
    {
        return [
            ['desafios_estado_nivel_index', 'desafios', '"estado", "nivel_requerido"'],
            ['desafios_estado_fecha_index', 'desafios', '"estado", "fecha_creacion"'],
            ['entregas_alumno_desafio_index', 'entregas', '"id_alumno", "id_desafio"'],
            ['entregas_estado_fecha_index', 'entregas', '"estado", "fecha_entrega"'],
            ['canjes_alumno_estado_fecha_index', 'canjes', '"id_alumno", "estado", "fecha"'],
            ['canjes_estado_fecha_index', 'canjes', '"estado", "fecha"'],
            ['premios_stock_precio_index', 'premios', '"stock", "categoria", "precio"'],
            ['premios_stock_digital_premio_estado_index', 'premios_stock_digital', '"id_premio", "estado"'],
            ['preguntas_examen_orden_index', 'preguntas', '"examen_id", "orden"'],
            ['respuestas_examen_alumno_examen_index', 'respuestas_examen', '"alumno_id", "examen_id"'],
            ['respuestas_examen_fecha_index', 'respuestas_examen', '"fecha_envio"'],
            ['usuarios_rol_tokens_nombre_index', 'usuarios', '"rol", "tokens", "nombre_completo"'],
            ['bots_alumnos_alumno_index', 'bots_alumnos', '"id_alumno"'],
        ];
    }
};
