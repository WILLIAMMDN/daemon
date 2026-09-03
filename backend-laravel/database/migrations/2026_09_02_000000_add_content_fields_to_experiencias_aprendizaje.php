<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('experiencias_aprendizaje', function (Blueprint $table): void {
            $table->text('descripcion')->nullable()->after('titulo');
            $table->json('contenido')->nullable()->after('descripcion');
            $table->json('guia_entrega')->nullable()->after('regla_completitud');
        });
    }

    public function down(): void
    {
        Schema::table('experiencias_aprendizaje', function (Blueprint $table): void {
            $table->dropColumn(['descripcion', 'contenido', 'guia_entrega']);
        });
    }
};
