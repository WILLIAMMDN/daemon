<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('desafios', function (Blueprint $table): void {
            $table->foreignId('id_institucion')->nullable()->constrained('instituciones')->nullOnDelete();
            $table->foreignId('id_aula')->nullable()->constrained('aulas')->nullOnDelete();
            $table->foreignId('id_leccion')->nullable()->constrained('lecciones')->nullOnDelete();
            $table->unsignedInteger('puntaje_maximo')->default(100);
            $table->index(['id_institucion', 'id_aula', 'estado'], 'desafios_alcance_estado_index');
        });

        Schema::table('examenes', function (Blueprint $table): void {
            $table->foreignId('id_institucion')->nullable()->constrained('instituciones')->nullOnDelete();
            $table->foreignId('id_aula')->nullable()->constrained('aulas')->nullOnDelete();
            $table->foreignId('id_leccion')->nullable()->constrained('lecciones')->nullOnDelete();
            $table->unsignedInteger('puntaje_maximo')->default(100);
            $table->index(['id_institucion', 'id_aula', 'estado'], 'examenes_alcance_estado_index');
        });

        Schema::table('entregas', function (Blueprint $table): void {
            $table->decimal('puntaje_academico', 7, 2)->nullable();
        });

        if (DB::table('instituciones')->count() === 1) {
            $institucionId = DB::table('instituciones')->value('id');
            DB::table('desafios')->whereNull('id_institucion')->update(['id_institucion' => $institucionId]);
            DB::table('examenes')->whereNull('id_institucion')->update(['id_institucion' => $institucionId]);
        }

        foreach (DB::table('respuestas_examen')
            ->select('alumno_id', 'examen_id')
            ->groupBy('alumno_id', 'examen_id')
            ->havingRaw('COUNT(*) > 1')
            ->get() as $duplicado) {
            $idsDescartar = DB::table('respuestas_examen')
                ->where('alumno_id', $duplicado->alumno_id)
                ->where('examen_id', $duplicado->examen_id)
                ->orderByDesc('fecha_envio')
                ->orderByDesc('id')
                ->pluck('id')
                ->slice(1);
            DB::table('respuestas_examen')->whereIn('id', $idsDescartar)->delete();
        }
        Schema::table('respuestas_examen', function (Blueprint $table): void {
            $table->unique(['alumno_id', 'examen_id'], 'respuestas_examen_alumno_examen_unique');
        });

        Schema::create('mision_objetivo', function (Blueprint $table): void {
            $table->foreignId('id_mision')->constrained('desafios')->cascadeOnDelete();
            $table->foreignId('id_objetivo')->constrained('objetivos_aprendizaje')->cascadeOnDelete();
            $table->primary(['id_mision', 'id_objetivo']);
        });

        Schema::create('evaluacion_objetivo', function (Blueprint $table): void {
            $table->foreignId('id_evaluacion')->constrained('examenes')->cascadeOnDelete();
            $table->foreignId('id_objetivo')->constrained('objetivos_aprendizaje')->cascadeOnDelete();
            $table->primary(['id_evaluacion', 'id_objetivo']);
        });

        Schema::create('categorias_calificacion', function (Blueprint $table): void {
            $table->id();
            $table->uuid('sourced_id')->unique();
            $table->foreignId('id_institucion')->constrained('instituciones')->cascadeOnDelete();
            $table->string('titulo', 120);
            $table->string('tipo', 40)->default('academic');
            $table->string('estado', 20)->default('active');
            $table->timestamps();
            $table->unique(['id_institucion', 'titulo']);
        });

        Schema::create('items_calificacion', function (Blueprint $table): void {
            $table->id();
            $table->uuid('sourced_id')->unique();
            $table->foreignId('id_institucion')->constrained('instituciones')->cascadeOnDelete();
            $table->foreignId('id_curso')->nullable()->constrained('cursos')->nullOnDelete();
            $table->foreignId('id_aula')->nullable()->constrained('aulas')->nullOnDelete();
            $table->foreignId('id_leccion')->nullable()->constrained('lecciones')->nullOnDelete();
            $table->foreignId('id_categoria')->nullable()->constrained('categorias_calificacion')->nullOnDelete();
            $table->string('origen_tipo', 40);
            $table->unsignedBigInteger('origen_id');
            $table->string('titulo', 150);
            $table->text('descripcion')->nullable();
            $table->decimal('puntaje_maximo', 8, 2)->default(100);
            $table->decimal('ponderacion', 6, 3)->default(1);
            $table->string('estado', 20)->default('active');
            $table->timestamp('fecha_asignacion')->nullable();
            $table->timestamp('fecha_vencimiento')->nullable();
            $table->timestamps();
            $table->unique(['origen_tipo', 'origen_id']);
            $table->index(['id_institucion', 'id_aula', 'estado'], 'items_calificacion_alcance_index');
        });

        Schema::create('item_calificacion_objetivo', function (Blueprint $table): void {
            $table->foreignId('id_item_calificacion')->constrained('items_calificacion')->cascadeOnDelete();
            $table->foreignId('id_objetivo')->constrained('objetivos_aprendizaje')->cascadeOnDelete();
            $table->primary(['id_item_calificacion', 'id_objetivo']);
        });

        Schema::create('resultados_calificacion', function (Blueprint $table): void {
            $table->id();
            $table->uuid('sourced_id')->unique();
            $table->foreignId('id_item_calificacion')->constrained('items_calificacion')->cascadeOnDelete();
            $table->foreignId('id_alumno')->constrained('usuarios')->cascadeOnDelete();
            $table->foreignId('id_calificador')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->unsignedInteger('intento')->default(1);
            $table->decimal('puntaje', 8, 2);
            $table->decimal('puntaje_maximo', 8, 2);
            $table->decimal('porcentaje', 5, 2);
            $table->string('estado', 30)->default('fully graded');
            $table->text('retroalimentacion')->nullable();
            $table->timestamp('entregado_at')->nullable();
            $table->timestamp('calificado_at')->nullable();
            $table->json('metadatos')->nullable();
            $table->timestamps();
            $table->unique(['id_item_calificacion', 'id_alumno', 'intento'], 'resultados_item_alumno_intento_unique');
            $table->index(['id_alumno', 'calificado_at'], 'resultados_alumno_fecha_index');
        });

        Schema::create('dominios_objetivo', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('id_objetivo')->constrained('objetivos_aprendizaje')->cascadeOnDelete();
            $table->foreignId('id_alumno')->constrained('usuarios')->cascadeOnDelete();
            $table->decimal('porcentaje', 5, 2)->default(0);
            $table->string('nivel_dominio', 30)->default('sin_evidencia');
            $table->unsignedInteger('cantidad_evidencias')->default(0);
            $table->timestamp('ultima_evidencia_at')->nullable();
            $table->timestamp('calculado_at')->nullable();
            $table->timestamps();
            $table->unique(['id_objetivo', 'id_alumno']);
            $table->index(['id_alumno', 'nivel_dominio']);
        });
    }

    public function down(): void
    {
        Schema::table('respuestas_examen', function (Blueprint $table): void {
            $table->dropUnique('respuestas_examen_alumno_examen_unique');
        });
        Schema::dropIfExists('dominios_objetivo');
        Schema::dropIfExists('resultados_calificacion');
        Schema::dropIfExists('item_calificacion_objetivo');
        Schema::dropIfExists('items_calificacion');
        Schema::dropIfExists('categorias_calificacion');
        Schema::dropIfExists('evaluacion_objetivo');
        Schema::dropIfExists('mision_objetivo');

        Schema::table('entregas', fn (Blueprint $table) => $table->dropColumn('puntaje_academico'));

        Schema::table('examenes', function (Blueprint $table): void {
            $table->dropIndex('examenes_alcance_estado_index');
            $table->dropConstrainedForeignId('id_leccion');
            $table->dropConstrainedForeignId('id_aula');
            $table->dropConstrainedForeignId('id_institucion');
            $table->dropColumn('puntaje_maximo');
        });

        Schema::table('desafios', function (Blueprint $table): void {
            $table->dropIndex('desafios_alcance_estado_index');
            $table->dropConstrainedForeignId('id_leccion');
            $table->dropConstrainedForeignId('id_aula');
            $table->dropConstrainedForeignId('id_institucion');
            $table->dropColumn('puntaje_maximo');
        });
    }
};
