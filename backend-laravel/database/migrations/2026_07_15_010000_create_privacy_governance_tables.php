<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consentimientos_privacidad', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('usuario_id')->constrained('usuarios')->cascadeOnDelete();
            $table->string('audiencia', 10);
            $table->string('version_politica', 32);
            $table->string('estado', 32)->default('declarado');
            $table->text('email_tutor')->nullable();
            $table->char('ip_hash', 64)->nullable();
            $table->char('user_agent_hash', 64)->nullable();
            $table->timestampTz('aceptado_at');
            $table->timestampTz('verificado_at')->nullable();
            $table->timestampTz('revocado_at')->nullable();
            $table->timestampsTz();

            $table->unique(['usuario_id', 'version_politica'], 'consentimiento_usuario_version_unique');
            $table->index(['audiencia', 'estado']);
        });

        Schema::create('solicitudes_privacidad', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('usuario_id')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->char('referencia_usuario_hash', 64);
            $table->string('tipo', 24);
            $table->string('estado', 24)->default('pendiente');
            $table->text('motivo')->nullable();
            $table->text('resolucion')->nullable();
            $table->timestampTz('solicitado_at');
            $table->timestampTz('resuelto_at')->nullable();
            $table->timestampsTz();

            $table->index(['usuario_id', 'tipo', 'estado']);
            $table->index(['estado', 'solicitado_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('solicitudes_privacidad');
        Schema::dropIfExists('consentimientos_privacidad');
    }
};
