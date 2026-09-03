<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('artefactos_aprendizaje', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('id_intento')->constrained('intentos_aprendizaje')->cascadeOnDelete();
            $table->foreignId('id_evidencia')->nullable()->constrained('evidencias_aprendizaje')->nullOnDelete();
            $table->foreignId('id_usuario')->constrained('usuarios')->cascadeOnDelete();
            $table->string('categoria', 50);
            $table->string('nombre_original');
            $table->string('storage_path')->nullable();
            $table->string('disk', 50)->nullable();
            $table->string('mime_type', 100)->nullable();
            $table->unsignedBigInteger('tamanio_bytes')->nullable();
            $table->string('checksum_sha256', 64)->nullable();
            $table->text('url_externa')->nullable();
            $table->json('metadatos')->nullable();
            $table->timestamps();

            $table->index(['id_intento', 'categoria']);
            $table->index('id_evidencia');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('artefactos_aprendizaje');
    }
};
