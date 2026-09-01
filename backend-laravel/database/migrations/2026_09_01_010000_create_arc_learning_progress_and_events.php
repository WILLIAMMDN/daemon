<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('progresos_leccion', function (Blueprint $table): void {
            $table->dropUnique(['id_leccion', 'id_alumno']);
            $table->foreignId('id_matricula')->nullable()->after('id_alumno')
                ->constrained('matriculas_aula')->cascadeOnDelete();
            $table->unique(['id_matricula', 'id_leccion']);
            $table->index(['id_alumno', 'id_leccion', 'estado']);
        });

        Schema::create('intentos_aprendizaje', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('clave_idempotencia', 190)->nullable()->unique();
            $table->foreignId('id_matricula')->constrained('matriculas_aula')->cascadeOnDelete();
            $table->foreignId('id_alumno')->constrained('usuarios')->cascadeOnDelete();
            $table->foreignId('id_experiencia')->constrained('experiencias_aprendizaje')->cascadeOnDelete();
            $table->unsignedSmallInteger('numero');
            $table->string('estado', 20)->default('started');
            $table->decimal('puntaje', 6, 2)->nullable();
            $table->boolean('aprobado')->nullable();
            $table->timestamp('iniciado_at');
            $table->timestamp('enviado_at')->nullable();
            $table->timestamp('evaluado_at')->nullable();
            $table->json('metadatos')->nullable();
            $table->timestamps();
            $table->unique(['id_matricula', 'id_experiencia', 'numero']);
            $table->index(['id_alumno', 'estado', 'created_at']);
        });

        Schema::create('evidencias_aprendizaje', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('id_intento')->constrained('intentos_aprendizaje')->cascadeOnDelete();
            $table->foreignId('id_objetivo')->nullable()->constrained('objetivos_aprendizaje')->nullOnDelete();
            $table->string('tipo', 40);
            $table->text('referencia')->nullable();
            $table->json('metadatos')->nullable();
            $table->timestamp('registrado_at');
            $table->timestamps();
            $table->index(['id_intento', 'id_objetivo']);
        });

        Schema::create('feedback_aprendizaje', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('id_intento')->constrained('intentos_aprendizaje')->cascadeOnDelete();
            $table->foreignId('id_autor')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->text('comentario')->nullable();
            $table->json('criterios')->nullable();
            $table->timestamp('registrado_at');
            $table->timestamps();
            $table->index(['id_intento', 'registrado_at']);
        });

        Schema::create('progresos_experiencia', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('id_matricula')->constrained('matriculas_aula')->cascadeOnDelete();
            $table->foreignId('id_alumno')->constrained('usuarios')->cascadeOnDelete();
            $table->foreignId('id_experiencia')->constrained('experiencias_aprendizaje')->cascadeOnDelete();
            $table->foreignId('id_intento_completado')->nullable()->constrained('intentos_aprendizaje')->nullOnDelete();
            $table->string('estado', 20)->default('notStarted');
            $table->unsignedTinyInteger('porcentaje')->default(0);
            $table->timestamp('iniciado_at')->nullable();
            $table->timestamp('completado_at')->nullable();
            $table->timestamps();
            $table->unique(['id_matricula', 'id_experiencia']);
            $table->index(['id_matricula', 'estado']);
        });

        Schema::table('eventos_dominio', function (Blueprint $table): void {
            $table->string('clave_idempotencia', 190)->nullable()->unique()->after('uuid');
            $table->foreignId('id_alumno')->nullable()->after('agregado_id')->constrained('usuarios')->nullOnDelete();
            $table->foreignId('id_matricula')->nullable()->after('id_alumno')->constrained('matriculas_aula')->nullOnDelete();
            $table->foreignId('id_version_curso')->nullable()->after('id_matricula')->constrained('versiones_curso')->nullOnDelete();
            $table->index(['tipo', 'id_matricula', 'ocurrido_at']);
        });
    }

    public function down(): void
    {
        Schema::table('eventos_dominio', function (Blueprint $table): void {
            $table->dropIndex(['tipo', 'id_matricula', 'ocurrido_at']);
            $table->dropConstrainedForeignId('id_version_curso');
            $table->dropConstrainedForeignId('id_matricula');
            $table->dropConstrainedForeignId('id_alumno');
            $table->dropUnique(['clave_idempotencia']);
            $table->dropColumn('clave_idempotencia');
        });
        Schema::dropIfExists('progresos_experiencia');
        Schema::dropIfExists('feedback_aprendizaje');
        Schema::dropIfExists('evidencias_aprendizaje');
        Schema::dropIfExists('intentos_aprendizaje');
        Schema::table('progresos_leccion', function (Blueprint $table): void {
            $table->dropIndex(['id_alumno', 'id_leccion', 'estado']);
            $table->dropUnique(['id_matricula', 'id_leccion']);
            $table->dropConstrainedForeignId('id_matricula');
            $table->unique(['id_leccion', 'id_alumno']);
        });
    }
};
