<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * @var array<string, string>
     */
    private const LEVEL_COLUMNS = [
        'usuarios' => 'nivel',
        'aulas' => 'nivel',
        'desafios' => 'nivel_requerido',
        'examenes' => 'nivel',
        'premios' => 'categoria',
    ];

    public function up(): void
    {
        foreach (self::LEVEL_COLUMNS as $table => $column) {
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, $column)) {
                continue;
            }

            DB::table($table)
                ->where($column, 'PRO')
                ->update([$column => 'TEENS']);
        }

        if (Schema::hasTable('usuarios') && Schema::hasColumn('usuarios', 'nivel')) {
            DB::table('usuarios')
                ->where('nivel', 'DOCENTE')
                ->update(['nivel' => 'TEENS']);
        }
    }

    public function down(): void
    {
        // Las equivalencias legacy PRO/DOCENTE -> TEENS son una normalizacion
        // irreversible: el rol docente permanece en usuarios.rol.
    }
};
