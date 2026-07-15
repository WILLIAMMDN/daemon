<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consentimientos_privacidad', function (Blueprint $table): void {
            $table->char('email_tutor_hash', 64)->nullable()->after('email_tutor')->index();
        });

        Schema::create('tutores_alumnos', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tutor_id')->constrained('usuarios')->cascadeOnDelete();
            $table->foreignId('alumno_id')->constrained('usuarios')->cascadeOnDelete();
            $table->foreignId('consentimiento_id')->nullable()->constrained('consentimientos_privacidad')->nullOnDelete();
            $table->string('parentesco', 16)->default('tutor');
            $table->string('estado', 16)->default('activo');
            $table->timestampTz('verificado_at');
            $table->timestampsTz();

            $table->unique(['tutor_id', 'alumno_id'], 'tutor_alumno_unique');
            $table->index(['alumno_id', 'estado']);
        });

        Schema::create('limites_pantalla', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('alumno_id')->unique()->constrained('usuarios')->cascadeOnDelete();
            $table->foreignId('actualizado_por')->constrained('usuarios')->cascadeOnDelete();
            $table->unsignedSmallInteger('max_minutos_diarios')->default(90);
            $table->time('hora_silencio_inicio')->nullable();
            $table->time('hora_silencio_fin')->nullable();
            $table->string('zona_horaria', 64)->default('America/Lima');
            $table->boolean('activo')->default(false);
            $table->timestampsTz();
        });

        Schema::create('uso_pantalla_diario', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('alumno_id')->constrained('usuarios')->cascadeOnDelete();
            $table->date('fecha_local');
            $table->unsignedInteger('segundos_activos')->default(0);
            $table->timestampsTz();

            $table->unique(['alumno_id', 'fecha_local'], 'uso_pantalla_alumno_fecha_unique');
            $table->index('fecha_local');
        });

        Schema::create('membresias_familiares', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('alumno_id')->unique()->constrained('usuarios')->cascadeOnDelete();
            $table->string('plan', 64)->default('Sin plan registrado');
            $table->string('estado', 24)->default('sin_configurar');
            $table->unsignedInteger('importe_centimos')->nullable();
            $table->char('moneda', 3)->default('PEN');
            $table->string('proveedor', 32)->nullable();
            $table->timestampTz('ultimo_pago_at')->nullable();
            $table->timestampTz('proximo_pago_at')->nullable();
            $table->timestampsTz();

            $table->index(['estado', 'proximo_pago_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('membresias_familiares');
        Schema::dropIfExists('uso_pantalla_diario');
        Schema::dropIfExists('limites_pantalla');
        Schema::dropIfExists('tutores_alumnos');

        Schema::table('consentimientos_privacidad', function (Blueprint $table): void {
            $table->dropColumn('email_tutor_hash');
        });
    }
};
