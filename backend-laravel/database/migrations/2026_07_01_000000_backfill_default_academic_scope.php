<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('instituciones') || ! Schema::hasTable('aulas') || ! Schema::hasTable('usuarios')) {
            return;
        }

        DB::transaction(function (): void {
            $institucionId = DB::table('instituciones')->where('slug', 'daemon-general')->value('id');

            if (! $institucionId) {
                $institucionId = DB::table('instituciones')->insertGetId([
                    'nombre' => 'DAEMON',
                    'slug' => 'daemon-general',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $aulaId = DB::table('aulas')->where('codigo', 'DAEMON-GENERAL')->value('id');

            if (! $aulaId) {
                $aulaId = DB::table('aulas')->insertGetId([
                    'id_institucion' => $institucionId,
                    'nombre' => 'Aula General DAEMON',
                    'nivel' => 'TODOS',
                    'codigo' => 'DAEMON-GENERAL',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::table('usuarios')
                ->whereIn('rol', ['alumno', 'docente'])
                ->whereNull('id_aula')
                ->update([
                    'id_institucion' => $institucionId,
                    'id_aula' => $aulaId,
                ]);

            DB::table('usuarios')
                ->whereIn('rol', ['alumno', 'docente'])
                ->whereNull('id_institucion')
                ->whereNotNull('id_aula')
                ->update(['id_institucion' => $institucionId]);
        });
    }

    public function down(): void
    {
        // No se limpian asignaciones para evitar dejar docentes/alumnos sin aula por rollback accidental.
    }
};
