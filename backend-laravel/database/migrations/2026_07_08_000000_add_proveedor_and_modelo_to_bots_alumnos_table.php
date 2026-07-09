<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bots_alumnos', function (Blueprint $table) {
            $table->string('proveedor')->default('ollama');
            $table->string('modelo_ia')->default('gemma2:9b');
        });
    }

    public function down(): void
    {
        Schema::table('bots_alumnos', function (Blueprint $table) {
            $table->dropColumn(['proveedor', 'modelo_ia']);
        });
    }
};
