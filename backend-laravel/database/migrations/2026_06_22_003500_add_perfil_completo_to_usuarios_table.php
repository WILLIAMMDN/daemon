<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('usuarios') || Schema::hasColumn('usuarios', 'perfil_completo')) {
            return;
        }

        Schema::table('usuarios', function (Blueprint $table) {
            $after = Schema::hasColumn('usuarios', 'google_id') ? 'google_id' : 'email';
            $table->boolean('perfil_completo')->default(true)->after($after);
        });

        DB::table('usuarios')
            ->whereNotNull('google_id')
            ->where('rol', 'alumno')
            ->update(['perfil_completo' => false]);
    }

    public function down(): void
    {
        if (! Schema::hasTable('usuarios') || ! Schema::hasColumn('usuarios', 'perfil_completo')) {
            return;
        }

        Schema::table('usuarios', function (Blueprint $table) {
            $table->dropColumn('perfil_completo');
        });
    }
};
