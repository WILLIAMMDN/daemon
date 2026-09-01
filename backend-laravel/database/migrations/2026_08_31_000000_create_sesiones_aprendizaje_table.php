<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sesiones_aprendizaje', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('id_aula')->constrained('aulas')->cascadeOnDelete();
            $table->foreignId('id_creador')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->string('titulo', 150);
            $table->text('descripcion')->nullable();
            $table->string('tipo', 30)->default('live');
            $table->timestampTz('inicio_at');
            $table->timestampTz('fin_at')->nullable();
            $table->string('estado', 30)->default('scheduled');
            $table->text('acceso_url')->nullable();
            $table->timestampsTz();

            $table->index(['id_aula', 'inicio_at'], 'sesiones_aula_inicio_index');
            $table->index(['id_aula', 'estado', 'inicio_at'], 'sesiones_aula_estado_inicio_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sesiones_aprendizaje');
    }
};
