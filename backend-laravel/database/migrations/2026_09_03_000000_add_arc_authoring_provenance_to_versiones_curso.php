<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Trazabilidad mínima de autoría para Course Operations / Studio V1.
 *
 * Sólo columnas nulables: ninguna versión existente cambia de comportamiento y
 * el Learning Core sigue leyendo exactamente el mismo contrato. Responde a
 * "quién creó el borrador, desde qué versión y quién publicó".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('versiones_curso', function (Blueprint $table): void {
            $table->foreignId('id_autor')->nullable()->after('estado')
                ->constrained('usuarios')->nullOnDelete();
            $table->foreignId('id_publicador')->nullable()->after('id_autor')
                ->constrained('usuarios')->nullOnDelete();
            $table->foreignId('id_version_origen')->nullable()->after('id_publicador')
                ->constrained('versiones_curso')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('versiones_curso', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('id_version_origen');
            $table->dropConstrainedForeignId('id_publicador');
            $table->dropConstrainedForeignId('id_autor');
        });
    }
};
