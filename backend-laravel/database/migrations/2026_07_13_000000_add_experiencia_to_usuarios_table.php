<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('usuarios', 'experiencia')) {
            Schema::table('usuarios', function (Blueprint $table): void {
                $table->integer('experiencia')->default(0)->after('tokens');
                $table->index(['rol', 'experiencia'], 'usuarios_rol_experiencia_index');
            });
        }

        // Conserva el punto de partida del ranking existente. Desde esta
        // migracion, las compras solo descuentan tokens y nunca experiencia.
        DB::table('usuarios')
            ->where('experiencia', 0)
            ->where('tokens', '>', 0)
            ->update(['experiencia' => DB::raw('tokens')]);
    }

    public function down(): void
    {
        if (Schema::hasColumn('usuarios', 'experiencia')) {
            Schema::table('usuarios', function (Blueprint $table): void {
                $table->dropIndex('usuarios_rol_experiencia_index');
                $table->dropColumn('experiencia');
            });
        }
    }
};
