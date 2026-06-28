<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        $this->eliminarTablasLaravelNoUsadas();
        $this->crearIndicesOperativos();
        $this->crearLlavesForaneasSeguras();
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        foreach ($this->llavesForaneas() as [$tabla, $constraint]) {
            DB::statement(sprintf(
                'alter table "%s" drop constraint if exists "%s"',
                str_replace('"', '""', $tabla),
                str_replace('"', '""', $constraint),
            ));
        }

        foreach ($this->indices() as [$indice]) {
            DB::statement(sprintf('drop index if exists "%s"', str_replace('"', '""', $indice)));
        }
    }

    private function eliminarTablasLaravelNoUsadas(): void
    {
        if (Schema::hasTable('users') && DB::table('users')->count() === 0) {
            Schema::drop('users');
        }

        if (Schema::hasTable('password_reset_tokens') && DB::table('password_reset_tokens')->count() === 0) {
            Schema::drop('password_reset_tokens');
        }
    }

    private function crearIndicesOperativos(): void
    {
        foreach ($this->indices() as [$indice, $tabla, $columnas]) {
            DB::statement(sprintf(
                'create index if not exists "%s" on "%s" (%s)',
                str_replace('"', '""', $indice),
                str_replace('"', '""', $tabla),
                $columnas,
            ));
        }
    }

    private function crearLlavesForaneasSeguras(): void
    {
        foreach ($this->llavesForaneas() as [$tabla, $constraint, $definicion]) {
            if ($this->existeConstraint($tabla, $constraint)) {
                continue;
            }

            DB::statement(sprintf(
                'alter table "%s" add constraint "%s" %s',
                str_replace('"', '""', $tabla),
                str_replace('"', '""', $constraint),
                $definicion,
            ));
        }
    }

    private function existeConstraint(string $tabla, string $constraint): bool
    {
        return DB::table('information_schema.table_constraints')
            ->where('table_schema', 'public')
            ->where('table_name', $tabla)
            ->where('constraint_name', $constraint)
            ->exists();
    }

    /**
     * @return array<int, array{0: string, 1: string, 2: string}>
     */
    private function indices(): array
    {
        return [
            ['chat_live_id_usuario_index', 'chat_live', '"id_usuario"'],
            ['chat_live_fecha_index', 'chat_live', '"fecha"'],
            ['competencia_live_id_alumno_en_tarima_index', 'competencia_live', '"id_alumno_en_tarima"'],
            ['cuentos_id_alumno_index', 'cuentos', '"id_alumno"'],
            ['cuentos_fecha_creacion_index', 'cuentos', '"fecha_creacion"'],
            ['entregas_id_desafio_index', 'entregas', '"id_desafio"'],
            ['entregas_id_alumno_index', 'entregas', '"id_alumno"'],
            ['entregas_estado_index', 'entregas', '"estado"'],
            ['historial_movimientos_id_docente_index', 'historial_movimientos', '"id_docente"'],
            ['historial_movimientos_id_alumno_index', 'historial_movimientos', '"id_alumno"'],
            ['historial_movimientos_id_operador_index', 'historial_movimientos', '"id_operador"'],
            ['historial_movimientos_fecha_index', 'historial_movimientos', '"fecha"'],
            ['insignias_otorgadas_id_alumno_index', 'insignias_otorgadas', '"id_alumno"'],
            ['insignias_otorgadas_id_insignia_index', 'insignias_otorgadas', '"id_insignia"'],
            ['respuestas_examen_alumno_id_index', 'respuestas_examen', '"alumno_id"'],
            ['respuestas_examen_examen_id_index', 'respuestas_examen', '"examen_id"'],
            ['votos_live_id_alumno_candidato_index', 'votos_live', '"id_alumno_candidato"'],
            ['usuarios_rol_nivel_tokens_index', 'usuarios', '"rol", "nivel", "tokens"'],
            ['canjes_estado_index', 'canjes', '"estado"'],
            ['chat_mensajes_id_alumno_created_at_index', 'chat_mensajes', '"id_alumno", "created_at"'],
        ];
    }

    /**
     * No se fuerzan FKs sobre historial_movimientos.id_docente/id_alumno todavia:
     * el dump legacy contiene movimientos de sistema con id_docente=0 y dos alumnos eliminados.
     *
     * @return array<int, array{0: string, 1: string, 2: string}>
     */
    private function llavesForaneas(): array
    {
        return [
            ['chat_live', 'chat_live_id_usuario_foreign', 'foreign key ("id_usuario") references "usuarios" ("id") on delete cascade'],
            ['competencia_live', 'competencia_live_id_alumno_en_tarima_foreign', 'foreign key ("id_alumno_en_tarima") references "usuarios" ("id") on delete set null'],
            ['cuentos', 'cuentos_id_alumno_foreign', 'foreign key ("id_alumno") references "usuarios" ("id") on delete cascade'],
            ['entregas', 'entregas_id_desafio_foreign', 'foreign key ("id_desafio") references "desafios" ("id") on delete cascade'],
            ['entregas', 'entregas_id_alumno_foreign', 'foreign key ("id_alumno") references "usuarios" ("id") on delete cascade'],
            ['historial_movimientos', 'historial_movimientos_id_operador_foreign', 'foreign key ("id_operador") references "usuarios" ("id") on delete set null'],
            ['insignias_otorgadas', 'insignias_otorgadas_id_alumno_foreign', 'foreign key ("id_alumno") references "usuarios" ("id") on delete cascade'],
            ['insignias_otorgadas', 'insignias_otorgadas_id_insignia_foreign', 'foreign key ("id_insignia") references "insignias" ("id") on delete cascade'],
            ['neuro_maze_stats', 'neuro_maze_stats_id_alumno_foreign', 'foreign key ("id_alumno") references "usuarios" ("id") on delete cascade'],
            ['respuestas_examen', 'respuestas_examen_alumno_id_foreign', 'foreign key ("alumno_id") references "usuarios" ("id") on delete cascade'],
            ['respuestas_examen', 'respuestas_examen_examen_id_foreign', 'foreign key ("examen_id") references "examenes" ("id") on delete cascade'],
            ['votos_live', 'votos_live_id_alumno_juez_foreign', 'foreign key ("id_alumno_juez") references "usuarios" ("id") on delete cascade'],
            ['votos_live', 'votos_live_id_alumno_candidato_foreign', 'foreign key ("id_alumno_candidato") references "usuarios" ("id") on delete cascade'],
        ];
    }
};
