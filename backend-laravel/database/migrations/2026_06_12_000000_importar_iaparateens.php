<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        $ruta = database_path('iaparateens_db.sql');
        if (! is_file($ruta)) {
            throw new RuntimeException('No se encontro database/iaparateens_db.sql');
        }

        DB::unprepared(file_get_contents($ruta));
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        foreach (['votos_live', 'usuarios', 'team_members', 'respuestas_examen', 'premios_stock_digital', 'premios', 'preguntas', 'neuro_maze_stats', 'leads', 'insignias_otorgadas', 'insignias', 'ia_modelos', 'historial_rondas', 'historial_movimientos', 'examenes', 'entregas', 'desafios', 'cuentos', 'competencia_live', 'chat_mensajes', 'chat_live', 'canjes', 'bots_alumnos'] as $tabla) {
            DB::statement('DROP TABLE IF EXISTS '.$tabla);
        }
    }
};
