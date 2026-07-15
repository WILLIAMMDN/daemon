<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('entregas', function (Blueprint $table): void {
            $table->timestamp('fecha_revision')->nullable()->after('fecha_entrega');
            $table->index(['id_alumno', 'estado', 'fecha_revision'], 'entregas_alumno_estado_revision_index');
        });
    }

    public function down(): void
    {
        Schema::table('entregas', function (Blueprint $table): void {
            $table->dropIndex('entregas_alumno_estado_revision_index');
            $table->dropColumn('fecha_revision');
        });
    }
};
