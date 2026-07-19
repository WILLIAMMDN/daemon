<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reportes_contenido', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('id_reportante')->constrained('usuarios')->cascadeOnDelete();
            $table->foreignId('id_usuario_reportado')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->foreignId('id_asignado')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->string('tipo_contenido', 40);
            $table->string('id_contenido', 100)->nullable();
            $table->string('categoria', 40);
            $table->text('descripcion')->nullable();
            $table->string('severidad', 20)->default('normal');
            $table->string('estado', 20)->default('pending');
            $table->text('resolucion')->nullable();
            $table->timestamp('resuelto_at')->nullable();
            $table->timestamps();
            $table->index(['estado', 'severidad', 'created_at']);
            $table->index(['tipo_contenido', 'id_contenido']);
        });

        Schema::create('bloqueos_usuario', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('id_usuario')->constrained('usuarios')->cascadeOnDelete();
            $table->foreignId('id_bloqueado')->constrained('usuarios')->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['id_usuario', 'id_bloqueado']);
        });

        Schema::create('eventos_producto', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('id_usuario')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->foreignId('id_institucion')->nullable()->constrained('instituciones')->nullOnDelete();
            $table->string('nombre', 80);
            $table->string('sesion_hash', 64)->nullable();
            $table->json('propiedades')->nullable();
            $table->timestamp('ocurrido_at');
            $table->timestamp('created_at')->useCurrent();
            $table->index(['nombre', 'ocurrido_at']);
            $table->index(['id_institucion', 'ocurrido_at']);
        });

        Schema::create('eventos_dominio', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('tipo', 100);
            $table->string('agregado_tipo', 80);
            $table->string('agregado_id', 100);
            $table->json('payload');
            $table->timestamp('ocurrido_at');
            $table->timestamp('publicado_at')->nullable();
            $table->unsignedSmallInteger('intentos')->default(0);
            $table->text('ultimo_error')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['publicado_at', 'ocurrido_at']);
            $table->index(['agregado_tipo', 'agregado_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('eventos_dominio');
        Schema::dropIfExists('eventos_producto');
        Schema::dropIfExists('bloqueos_usuario');
        Schema::dropIfExists('reportes_contenido');
    }
};
