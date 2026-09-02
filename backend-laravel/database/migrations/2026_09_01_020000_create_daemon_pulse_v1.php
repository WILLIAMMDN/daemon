<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pulse_politicas_recompensa', function (Blueprint $table): void {
            $table->id();
            $table->string('clave', 100)->unique();
            $table->string('nombre', 150);
            $table->string('tipo_evento', 100);
            $table->string('tipo_experiencia', 40)->nullable();
            $table->foreignId('id_version_curso')->nullable()->constrained('versiones_curso')->nullOnDelete();
            $table->foreignId('id_ruta_aprendizaje')->nullable()->constrained('rutas_aprendizaje')->nullOnDelete();
            $table->unsignedInteger('xp')->default(0);
            $table->unsignedInteger('daems')->default(0);
            $table->string('repetibilidad', 30)->default('once_per_event');
            $table->unsignedSmallInteger('limite_diario')->nullable();
            $table->boolean('actividad_racha')->default(false);
            $table->json('reglas_elegibilidad')->nullable();
            $table->boolean('activa')->default(true);
            $table->timestamp('vigente_desde')->nullable();
            $table->timestamp('vigente_hasta')->nullable();
            $table->foreignId('creada_por')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->foreignId('actualizada_por')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->timestamps();

            $table->index(['tipo_evento', 'activa']);
            $table->index(['vigente_desde', 'vigente_hasta']);
        });

        Schema::create('pulse_procesamientos_evento', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('id_evento_dominio')->unique()->constrained('eventos_dominio')->cascadeOnDelete();
            $table->string('estado', 20)->default('pending');
            $table->unsignedSmallInteger('politicas_aplicadas')->default(0);
            $table->unsignedSmallInteger('logros_otorgados')->default(0);
            $table->unsignedSmallInteger('intentos')->default(0);
            $table->text('ultimo_error')->nullable();
            $table->timestamp('procesado_at')->nullable();
            $table->timestamps();

            $table->index(['estado', 'updated_at']);
        });

        Schema::create('pulse_aplicaciones_politica', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('id_evento_dominio')->constrained('eventos_dominio')->cascadeOnDelete();
            $table->foreignId('id_politica')->constrained('pulse_politicas_recompensa')->restrictOnDelete();
            $table->foreignId('id_usuario')->constrained('usuarios')->cascadeOnDelete();
            $table->foreignId('id_matricula')->nullable()->constrained('matriculas_aula')->nullOnDelete();
            $table->string('clave_repeticion', 190)->unique();
            $table->date('fecha_local')->nullable();
            $table->json('contexto')->nullable();
            $table->timestamp('aplicado_at');
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['id_evento_dominio', 'id_politica']);
            $table->index(['id_usuario', 'id_politica', 'fecha_local'], 'pulse_aplicaciones_usuario_politica_fecha');
        });

        Schema::create('pulse_rachas', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('id_usuario')->unique()->constrained('usuarios')->cascadeOnDelete();
            $table->unsignedInteger('racha_actual')->default(0);
            $table->unsignedInteger('racha_maxima')->default(0);
            $table->date('ultima_fecha_local')->nullable();
            $table->string('zona_horaria', 64)->default('UTC');
            $table->timestamps();
        });

        Schema::create('pulse_dias_racha', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('id_usuario')->constrained('usuarios')->cascadeOnDelete();
            $table->foreignId('id_evento_dominio')->nullable()->constrained('eventos_dominio')->nullOnDelete();
            $table->foreignId('id_politica')->nullable()->constrained('pulse_politicas_recompensa')->nullOnDelete();
            $table->date('fecha_local');
            $table->string('zona_horaria', 64);
            $table->timestamp('calificado_at');
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['id_usuario', 'fecha_local']);
            $table->index(['fecha_local', 'id_usuario']);
        });

        Schema::table('movimientos_economia', function (Blueprint $table): void {
            $table->string('tipo_transaccion', 20)->nullable()->after('moneda');
            $table->foreignId('id_evento_dominio')->nullable()->after('id_actor')->constrained('eventos_dominio')->nullOnDelete();
            $table->foreignId('id_politica_pulse')->nullable()->after('id_evento_dominio')->constrained('pulse_politicas_recompensa')->nullOnDelete();
            $table->foreignId('id_matricula')->nullable()->after('id_politica_pulse')->constrained('matriculas_aula')->nullOnDelete();
            $table->index(['id_evento_dominio', 'id_politica_pulse'], 'movimientos_economia_evento_politica');
        });

        Schema::table('insignias', function (Blueprint $table): void {
            $table->string('clave_pulse', 100)->nullable()->unique();
            $table->string('categoria', 60)->nullable();
            $table->boolean('activa')->default(true);
            $table->boolean('repetible')->default(false);
            $table->string('tipo_criterio', 40)->nullable();
            $table->json('configuracion_criterio')->nullable();
            $table->index(['activa', 'tipo_criterio']);
        });

        Schema::table('insignias_otorgadas', function (Blueprint $table): void {
            $table->string('clave_idempotencia', 190)->nullable()->unique();
            $table->foreignId('id_evento_dominio')->nullable()->constrained('eventos_dominio')->nullOnDelete();
            $table->foreignId('id_aplicacion_pulse')->nullable()->constrained('pulse_aplicaciones_politica')->nullOnDelete();
            $table->json('contexto')->nullable();
            $table->index(['id_alumno', 'fecha']);
        });
    }

    public function down(): void
    {
        Schema::table('insignias_otorgadas', function (Blueprint $table): void {
            $table->dropIndex(['id_alumno', 'fecha']);
            $table->dropConstrainedForeignId('id_aplicacion_pulse');
            $table->dropConstrainedForeignId('id_evento_dominio');
            $table->dropUnique(['clave_idempotencia']);
            $table->dropColumn(['clave_idempotencia', 'contexto']);
        });

        Schema::table('insignias', function (Blueprint $table): void {
            $table->dropIndex(['activa', 'tipo_criterio']);
            $table->dropUnique(['clave_pulse']);
            $table->dropColumn(['clave_pulse', 'categoria', 'activa', 'repetible', 'tipo_criterio', 'configuracion_criterio']);
        });

        Schema::table('movimientos_economia', function (Blueprint $table): void {
            $table->dropIndex('movimientos_economia_evento_politica');
            $table->dropConstrainedForeignId('id_matricula');
            $table->dropConstrainedForeignId('id_politica_pulse');
            $table->dropConstrainedForeignId('id_evento_dominio');
            $table->dropColumn('tipo_transaccion');
        });

        Schema::dropIfExists('pulse_dias_racha');
        Schema::dropIfExists('pulse_rachas');
        Schema::dropIfExists('pulse_aplicaciones_politica');
        Schema::dropIfExists('pulse_procesamientos_evento');
        Schema::dropIfExists('pulse_politicas_recompensa');
    }
};
