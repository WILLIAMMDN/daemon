<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Corrige el alcance del orden de unidades curriculares.
 *
 * `unique(id_curso, orden)` nació en la fundación de interoperabilidad
 * (2026_07_19), antes de que existieran las versiones de curso. Cuando
 * 2026_09_01 añadió `id_version_curso`, ese índice quedó desalineado: impide
 * que un mismo curso tenga dos versiones con una "Unidad 1", que es
 * exactamente lo que exige el modelo de versiones inmutables (V1 publicada +
 * V2 borrador).
 *
 * El orden de una unidad siempre fue relativo a su versión curricular, así que
 * esta migración sólo reubica la restricción donde corresponde. Es compatible
 * hacia atrás: relaja una unicidad demasiado amplia y aplica la correcta. Las
 * unidades heredadas sin versión (`id_version_curso` nulo) no colisionan, ya
 * que los índices únicos no comparan valores nulos entre sí.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('unidades_curso', function (Blueprint $table): void {
            $table->dropUnique('unidades_curso_id_curso_orden_unique');
            $table->unique(['id_version_curso', 'orden'], 'unidades_curso_version_orden_unique');
        });
    }

    public function down(): void
    {
        Schema::table('unidades_curso', function (Blueprint $table): void {
            $table->dropUnique('unidades_curso_version_orden_unique');
            $table->unique(['id_curso', 'orden'], 'unidades_curso_id_curso_orden_unique');
        });
    }
};
