<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('periodos_academicos', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('id_institucion')->constrained('instituciones')->cascadeOnDelete();
            $table->uuid('sourced_id')->unique();
            $table->string('titulo', 150);
            $table->string('tipo', 30)->default('schoolYear');
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->foreignId('id_padre')->nullable()->constrained('periodos_academicos')->nullOnDelete();
            $table->string('estado', 20)->default('active');
            $table->timestamps();
            $table->index(['id_institucion', 'tipo', 'estado']);
        });

        Schema::create('cursos', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('id_institucion')->constrained('instituciones')->cascadeOnDelete();
            $table->uuid('sourced_id')->unique();
            $table->string('titulo', 150);
            $table->string('codigo', 60)->nullable();
            $table->text('descripcion')->nullable();
            $table->string('nivel', 20)->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->string('estado', 20)->default('draft');
            $table->timestamp('publicado_at')->nullable();
            $table->timestamps();
            $table->unique(['id_institucion', 'codigo']);
            $table->index(['id_institucion', 'estado', 'nivel']);
        });

        Schema::table('instituciones', function (Blueprint $table): void {
            $table->uuid('sourced_id')->nullable()->unique();
            $table->string('estado_interoperabilidad', 20)->default('active');
        });

        Schema::table('usuarios', function (Blueprint $table): void {
            $table->uuid('sourced_id')->nullable()->unique();
            $table->string('estado_interoperabilidad', 20)->default('active');
        });

        Schema::table('aulas', function (Blueprint $table): void {
            $table->uuid('sourced_id')->nullable()->unique();
            $table->foreignId('id_curso')->nullable()->constrained('cursos')->nullOnDelete();
            $table->foreignId('id_periodo_academico')->nullable()->constrained('periodos_academicos')->nullOnDelete();
            $table->string('tipo_clase', 20)->default('scheduled');
            $table->string('estado_interoperabilidad', 20)->default('active');
        });

        Schema::create('unidades_curso', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('id_curso')->constrained('cursos')->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->string('titulo', 150);
            $table->text('descripcion')->nullable();
            $table->unsignedInteger('orden')->default(1);
            $table->string('estado', 20)->default('draft');
            $table->timestamps();
            $table->unique(['id_curso', 'orden']);
        });

        Schema::create('lecciones', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('id_unidad')->constrained('unidades_curso')->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->string('titulo', 150);
            $table->text('resumen')->nullable();
            $table->json('contenido')->nullable();
            $table->unsignedInteger('orden')->default(1);
            $table->unsignedInteger('duracion_minutos')->nullable();
            $table->string('estado', 20)->default('draft');
            $table->timestamps();
            $table->unique(['id_unidad', 'orden']);
        });

        Schema::create('objetivos_aprendizaje', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('id_institucion')->constrained('instituciones')->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->string('codigo', 80)->nullable();
            $table->text('descripcion');
            $table->string('marco', 100)->nullable();
            $table->string('nivel', 20)->nullable();
            $table->timestamps();
            $table->unique(['id_institucion', 'codigo']);
        });

        Schema::create('leccion_objetivo', function (Blueprint $table): void {
            $table->foreignId('id_leccion')->constrained('lecciones')->cascadeOnDelete();
            $table->foreignId('id_objetivo')->constrained('objetivos_aprendizaje')->cascadeOnDelete();
            $table->primary(['id_leccion', 'id_objetivo']);
        });

        Schema::create('matriculas_aula', function (Blueprint $table): void {
            $table->id();
            $table->uuid('sourced_id')->unique();
            $table->foreignId('id_aula')->constrained('aulas')->cascadeOnDelete();
            $table->foreignId('id_usuario')->constrained('usuarios')->cascadeOnDelete();
            $table->string('rol', 30);
            $table->boolean('es_principal')->default(false);
            $table->date('fecha_inicio')->nullable();
            $table->date('fecha_fin')->nullable();
            $table->string('estado', 20)->default('active');
            $table->timestamps();
            $table->unique(['id_aula', 'id_usuario', 'rol']);
            $table->index(['id_usuario', 'estado']);
        });

        Schema::create('progresos_leccion', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('id_leccion')->constrained('lecciones')->cascadeOnDelete();
            $table->foreignId('id_alumno')->constrained('usuarios')->cascadeOnDelete();
            $table->string('estado', 20)->default('notStarted');
            $table->unsignedTinyInteger('porcentaje')->default(0);
            $table->timestamp('iniciado_at')->nullable();
            $table->timestamp('completado_at')->nullable();
            $table->json('evidencia')->nullable();
            $table->timestamps();
            $table->unique(['id_leccion', 'id_alumno']);
        });

        Schema::create('movimientos_economia', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('id_usuario')->constrained('usuarios')->cascadeOnDelete();
            $table->foreignId('id_actor')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->string('moneda', 20);
            $table->integer('variacion');
            $table->integer('saldo_anterior');
            $table->integer('saldo_resultante');
            $table->string('origen_tipo', 60);
            $table->string('origen_id', 100)->nullable();
            $table->string('clave_idempotencia', 180)->unique();
            $table->string('motivo', 180)->nullable();
            $table->json('metadatos')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['id_usuario', 'moneda', 'created_at']);
            $table->index(['origen_tipo', 'origen_id']);
        });

        Schema::create('clientes_oneroster', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('id_institucion')->constrained('instituciones')->cascadeOnDelete();
            $table->string('nombre', 120);
            $table->string('client_id', 100)->unique();
            $table->string('secret_hash');
            $table->json('scopes');
            $table->boolean('activo')->default(true);
            $table->timestamp('ultimo_uso_at')->nullable();
            $table->timestamps();
        });

        Schema::create('tokens_oneroster', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('id_cliente')->constrained('clientes_oneroster')->cascadeOnDelete();
            $table->string('token_hash', 64)->unique();
            $table->json('scopes');
            $table->timestamp('expira_at');
            $table->timestamp('revocado_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['id_cliente', 'expira_at']);
        });

        Schema::create('registros_lti', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('id_institucion')->constrained('instituciones')->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->string('nombre', 120);
            $table->string('rol_daemon', 20)->default('platform');
            $table->string('issuer', 500);
            $table->string('client_id', 180);
            $table->string('deployment_id', 180);
            $table->text('auth_login_url')->nullable();
            $table->text('auth_token_url')->nullable();
            $table->text('keyset_url')->nullable();
            $table->json('redirect_uris')->nullable();
            $table->json('servicios')->nullable();
            $table->boolean('activo')->default(false);
            $table->timestamp('verificado_at')->nullable();
            $table->timestamps();
            $table->unique(['issuer', 'client_id', 'deployment_id']);
        });

        Schema::create('vinculos_lti', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('id_registro_lti')->constrained('registros_lti')->cascadeOnDelete();
            $table->foreignId('id_usuario')->constrained('usuarios')->cascadeOnDelete();
            $table->string('subject', 255);
            $table->boolean('activo')->default(true);
            $table->timestamp('ultimo_acceso_at')->nullable();
            $table->timestamps();
            $table->unique(['id_registro_lti', 'subject']);
        });

        $this->backfillCompatibilityData();
    }

    private function backfillCompatibilityData(): void
    {
        DB::transaction(function (): void {
            foreach (DB::table('instituciones')->select('id')->get() as $institucion) {
                DB::table('instituciones')->where('id', $institucion->id)->whereNull('sourced_id')->update([
                    'sourced_id' => (string) Str::uuid(),
                ]);

                $periodoId = DB::table('periodos_academicos')->where('id_institucion', $institucion->id)->value('id');
                if (! $periodoId) {
                    $periodoId = DB::table('periodos_academicos')->insertGetId([
                        'id_institucion' => $institucion->id,
                        'sourced_id' => (string) Str::uuid(),
                        'titulo' => 'Año académico vigente',
                        'tipo' => 'schoolYear',
                        'fecha_inicio' => now()->startOfYear()->toDateString(),
                        'fecha_fin' => now()->endOfYear()->toDateString(),
                        'estado' => 'active',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                $cursoId = DB::table('cursos')->where('id_institucion', $institucion->id)->where('codigo', 'DAEMON-BASE')->value('id');
                if (! $cursoId) {
                    $cursoId = DB::table('cursos')->insertGetId([
                        'id_institucion' => $institucion->id,
                        'sourced_id' => (string) Str::uuid(),
                        'titulo' => 'Programa DAEMON',
                        'codigo' => 'DAEMON-BASE',
                        'descripcion' => 'Curso base migrado para conservar la operación académica existente.',
                        'estado' => 'published',
                        'publicado_at' => now(),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                DB::table('aulas')->where('id_institucion', $institucion->id)->whereNull('id_curso')->update([
                    'id_curso' => $cursoId,
                    'id_periodo_academico' => $periodoId,
                ]);
            }

            foreach (DB::table('aulas')->select('id')->whereNull('sourced_id')->get() as $aula) {
                DB::table('aulas')->where('id', $aula->id)->update(['sourced_id' => (string) Str::uuid()]);
            }

            foreach (DB::table('usuarios')->select('id')->whereNull('sourced_id')->get() as $usuario) {
                DB::table('usuarios')->where('id', $usuario->id)->update(['sourced_id' => (string) Str::uuid()]);
            }

            foreach (DB::table('usuarios')->whereNotNull('id_aula')->whereIn('rol', ['alumno', 'docente', 'admin'])->get(['id', 'id_aula', 'rol']) as $usuario) {
                DB::table('matriculas_aula')->insertOrIgnore([
                    'sourced_id' => (string) Str::uuid(),
                    'id_aula' => $usuario->id_aula,
                    'id_usuario' => $usuario->id,
                    'rol' => $usuario->rol === 'alumno' ? 'student' : ($usuario->rol === 'docente' ? 'teacher' : 'administrator'),
                    'es_principal' => true,
                    'estado' => 'active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vinculos_lti');
        Schema::dropIfExists('registros_lti');
        Schema::dropIfExists('tokens_oneroster');
        Schema::dropIfExists('clientes_oneroster');
        Schema::dropIfExists('movimientos_economia');
        Schema::dropIfExists('progresos_leccion');
        Schema::dropIfExists('matriculas_aula');
        Schema::dropIfExists('leccion_objetivo');
        Schema::dropIfExists('objetivos_aprendizaje');
        Schema::dropIfExists('lecciones');
        Schema::dropIfExists('unidades_curso');

        Schema::table('aulas', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('id_periodo_academico');
            $table->dropConstrainedForeignId('id_curso');
            $table->dropColumn(['sourced_id', 'tipo_clase', 'estado_interoperabilidad']);
        });
        Schema::table('usuarios', fn (Blueprint $table) => $table->dropColumn(['sourced_id', 'estado_interoperabilidad']));
        Schema::table('instituciones', fn (Blueprint $table) => $table->dropColumn(['sourced_id', 'estado_interoperabilidad']));

        Schema::dropIfExists('cursos');
        Schema::dropIfExists('periodos_academicos');
    }
};
