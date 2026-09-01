<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('versiones_curso', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('id_curso')->constrained('cursos')->cascadeOnDelete();
            $table->unsignedInteger('numero');
            $table->string('titulo', 150)->nullable();
            $table->text('descripcion')->nullable();
            $table->string('audiencia', 20);
            $table->string('etapa', 30);
            $table->string('estado', 20)->default('draft');
            $table->timestamp('publicado_at')->nullable();
            $table->timestamp('archivado_at')->nullable();
            $table->timestamps();
            $table->unique(['id_curso', 'numero']);
            $table->index(['id_curso', 'estado', 'audiencia']);
        });

        Schema::table('aulas', function (Blueprint $table): void {
            $table->foreignId('id_version_curso')->nullable()->after('id_curso')
                ->constrained('versiones_curso')->nullOnDelete();
        });

        Schema::table('unidades_curso', function (Blueprint $table): void {
            $table->foreignId('id_version_curso')->nullable()->after('id_curso')
                ->constrained('versiones_curso')->cascadeOnDelete();
            $table->index(['id_version_curso', 'orden']);
        });

        Schema::create('rutas_aprendizaje', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('id_institucion')->constrained('instituciones')->cascadeOnDelete();
            $table->foreignId('id_curso')->nullable()->constrained('cursos')->nullOnDelete();
            $table->foreignId('id_version_curso')->nullable()->constrained('versiones_curso')->nullOnDelete();
            $table->string('titulo', 150);
            $table->text('descripcion')->nullable();
            $table->string('audiencia', 20);
            $table->string('etapa', 30);
            $table->string('estado', 20)->default('draft');
            $table->timestamp('publicado_at')->nullable();
            $table->timestamps();
            $table->index(['id_institucion', 'estado', 'audiencia']);
            $table->index(['id_version_curso', 'estado']);
        });

        Schema::create('hitos_aprendizaje', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('id_ruta')->constrained('rutas_aprendizaje')->cascadeOnDelete();
            $table->string('titulo', 150);
            $table->text('descripcion')->nullable();
            $table->unsignedInteger('orden');
            $table->boolean('obligatorio')->default(true);
            $table->json('requisitos_completitud')->nullable();
            $table->timestamps();
            $table->unique(['id_ruta', 'orden']);
        });

        Schema::create('hito_prerrequisitos', function (Blueprint $table): void {
            $table->foreignId('id_hito')->constrained('hitos_aprendizaje')->cascadeOnDelete();
            $table->foreignId('id_prerrequisito')->constrained('hitos_aprendizaje')->cascadeOnDelete();
            $table->primary(['id_hito', 'id_prerrequisito']);
        });

        Schema::create('experiencias_aprendizaje', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('id_hito')->constrained('hitos_aprendizaje')->cascadeOnDelete();
            $table->foreignId('id_unidad')->nullable()->constrained('unidades_curso')->nullOnDelete();
            $table->string('tipo', 30);
            $table->string('variante', 40)->nullable();
            $table->string('titulo', 150);
            $table->string('origen_tipo', 60)->nullable();
            $table->unsignedBigInteger('origen_id')->nullable();
            $table->unsignedInteger('orden');
            $table->boolean('obligatoria')->default(true);
            $table->boolean('permite_intentos')->default(false);
            $table->unsignedSmallInteger('max_intentos')->nullable();
            $table->json('regla_completitud')->nullable();
            $table->string('estado', 20)->default('draft');
            $table->timestamps();
            $table->unique(['id_hito', 'orden']);
            $table->index(['origen_tipo', 'origen_id']);
            $table->index(['id_unidad', 'orden']);
        });

        Schema::create('experiencia_objetivo', function (Blueprint $table): void {
            $table->foreignId('id_experiencia')->constrained('experiencias_aprendizaje')->cascadeOnDelete();
            $table->foreignId('id_objetivo')->constrained('objetivos_aprendizaje')->cascadeOnDelete();
            $table->primary(['id_experiencia', 'id_objetivo']);
        });

        Schema::table('matriculas_aula', function (Blueprint $table): void {
            $table->foreignId('id_version_curso')->nullable()->after('id_aula')
                ->constrained('versiones_curso')->nullOnDelete();
            $table->foreignId('id_ruta_aprendizaje')->nullable()->after('id_version_curso')
                ->constrained('rutas_aprendizaje')->nullOnDelete();
            $table->index(['id_usuario', 'id_version_curso', 'estado']);
        });
    }

    public function down(): void
    {
        Schema::table('matriculas_aula', function (Blueprint $table): void {
            $table->dropIndex(['id_usuario', 'id_version_curso', 'estado']);
            $table->dropConstrainedForeignId('id_ruta_aprendizaje');
            $table->dropConstrainedForeignId('id_version_curso');
        });
        Schema::dropIfExists('experiencia_objetivo');
        Schema::dropIfExists('experiencias_aprendizaje');
        Schema::dropIfExists('hito_prerrequisitos');
        Schema::dropIfExists('hitos_aprendizaje');
        Schema::dropIfExists('rutas_aprendizaje');
        Schema::table('unidades_curso', function (Blueprint $table): void {
            $table->dropIndex(['id_version_curso', 'orden']);
            $table->dropConstrainedForeignId('id_version_curso');
        });
        Schema::table('aulas', fn (Blueprint $table) => $table->dropConstrainedForeignId('id_version_curso'));
        Schema::dropIfExists('versiones_curso');
    }
};
