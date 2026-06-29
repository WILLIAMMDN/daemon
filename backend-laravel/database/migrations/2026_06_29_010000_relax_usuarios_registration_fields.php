<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Reduccion del formulario de registro: pasamos de pedir 5 campos
 * a solo 2 (email + clave). El resto se completa despues, ya dentro
 * del sistema, en /bienvenida. Esto implica:
 *
 *   - nombre_completo pasa a nullable (lo pedimos despues)
 *   - usuario pasa a nullable (lo pedimos despues)
 *   - nivel pasa a nullable (lo pedimos despues)
 *   - perfil_completo cambia default a false para que los registros
 *     nuevos nazcan "incompletos" y el banner /bienvenida los guie
 *
 * Los usuarios ya existentes con perfil_completo=true siguen
 * funcionando igual: este cambio solo afecta filas nuevas.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('usuarios')) {
            return;
        }

        Schema::table('usuarios', function (Blueprint $table): void {
            if (! Schema::hasColumn('usuarios', 'nombre_completo')) {
                $table->string('nombre_completo', 100)->nullable();
            } else {
                $table->string('nombre_completo', 100)->nullable()->change();
            }

            if (! Schema::hasColumn('usuarios', 'usuario')) {
                $table->string('usuario', 50)->nullable()->unique();
            } else {
                $table->string('usuario', 50)->nullable()->change();
            }

            if (! Schema::hasColumn('usuarios', 'nivel')) {
                $table->string('nivel', 20)->nullable();
            } else {
                $table->string('nivel', 20)->nullable()->change();
            }
        });

        // Cambiamos el default de perfil_completo a false solo si la
        // base de datos es Postgres (las pruebas locales usan SQLite
        // donde cambiar defaults es mas quisquilloso).
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('alter table "usuarios" alter column "perfil_completo" set default false');
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('usuarios')) {
            return;
        }

        // El rollback vuelve a poner NOT NULL. Como puede haber filas
        // con NULLs de los registros nuevos, primero rellenamos esos
        // huecos con valores "legacy" para no romper la restriccion.
        DB::table('usuarios')
            ->whereNull('nombre_completo')
            ->update(['nombre_completo' => 'Sin nombre']);
        DB::table('usuarios')
            ->whereNull('usuario')
            ->update(['usuario' => DB::raw("'legacy_' || id")]);
        DB::table('usuarios')
            ->whereNull('nivel')
            ->update(['nivel' => 'TEENS']);

        Schema::table('usuarios', function (Blueprint $table): void {
            $table->string('nombre_completo', 100)->nullable(false)->change();
            $table->string('usuario', 50)->nullable(false)->change();
            $table->string('nivel', 20)->nullable(false)->change();
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('alter table "usuarios" alter column "perfil_completo" set default true');
        }
    }
};