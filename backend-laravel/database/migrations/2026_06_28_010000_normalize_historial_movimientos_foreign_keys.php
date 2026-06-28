<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql' || ! Schema::hasTable('historial_movimientos')) {
            return;
        }

        Schema::table('historial_movimientos', function (Blueprint $table) {
            if (! Schema::hasColumn('historial_movimientos', 'legacy_id_docente')) {
                $table->bigInteger('legacy_id_docente')->nullable()->after('id_docente');
            }

            if (! Schema::hasColumn('historial_movimientos', 'legacy_id_alumno')) {
                $table->bigInteger('legacy_id_alumno')->nullable()->after('id_alumno');
            }
        });

        DB::statement('alter table "historial_movimientos" alter column "id_docente" drop not null');
        DB::statement('alter table "historial_movimientos" alter column "id_alumno" drop not null');

        DB::statement(<<<'SQL'
            update historial_movimientos h
               set legacy_id_docente = h.id_docente,
                   id_docente = null
             where h.id_docente is not null
               and not exists (select 1 from usuarios u where u.id = h.id_docente)
        SQL);

        DB::statement(<<<'SQL'
            update historial_movimientos h
               set legacy_id_alumno = h.id_alumno,
                   id_alumno = null
             where h.id_alumno is not null
               and not exists (select 1 from usuarios u where u.id = h.id_alumno)
        SQL);

        $this->agregarFk('historial_movimientos_id_docente_foreign', 'id_docente');
        $this->agregarFk('historial_movimientos_id_alumno_foreign', 'id_alumno');
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql' || ! Schema::hasTable('historial_movimientos')) {
            return;
        }

        DB::statement('alter table "historial_movimientos" drop constraint if exists "historial_movimientos_id_docente_foreign"');
        DB::statement('alter table "historial_movimientos" drop constraint if exists "historial_movimientos_id_alumno_foreign"');
    }

    private function agregarFk(string $constraint, string $columna): void
    {
        $existe = DB::table('information_schema.table_constraints')
            ->where('table_schema', 'public')
            ->where('table_name', 'historial_movimientos')
            ->where('constraint_name', $constraint)
            ->exists();

        if ($existe) {
            return;
        }

        DB::statement(sprintf(
            'alter table "historial_movimientos" add constraint "%s" foreign key ("%s") references "usuarios" ("id") on delete set null',
            str_replace('"', '""', $constraint),
            str_replace('"', '""', $columna),
        ));
    }
};
