<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cuento_reacciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cuento_id')->constrained('cuentos')->onDelete('cascade');
            $table->foreignId('usuario_id')->constrained('usuarios')->onDelete('cascade');
            $table->timestamps();

            // Evitar reacciones duplicadas por usuario en un mismo cuento
            $table->unique(['cuento_id', 'usuario_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cuento_reacciones');
    }
};
