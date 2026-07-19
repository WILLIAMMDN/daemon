<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Las instalaciones MySQL heredadas usaban un ENUM fisico|digital.
        // PostgreSQL y los esquemas nuevos ya usan VARCHAR, pero normalizar el
        // legado evita que rechace la tercera entrega sin tocar sus datos.
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE premios MODIFY tipo_entrega VARCHAR(30) NOT NULL DEFAULT 'fisico'");
        }

        Schema::create('mascota_especies', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 60)->unique();
            $table->string('nombre', 100);
            $table->text('descripcion')->nullable();
            $table->string('asset_base', 255);
            $table->string('asset_miniatura', 255)->nullable();
            $table->unsignedSmallInteger('lienzo_ancho')->default(1024);
            $table->unsignedSmallInteger('lienzo_alto')->default(1024);
            $table->smallInteger('orden')->default(0);
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        Schema::create('mascota_cosmeticos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_premio')->nullable()->unique()->constrained('premios')->nullOnDelete();
            $table->string('codigo', 80)->unique();
            $table->string('nombre', 100);
            $table->string('slot', 30);
            $table->string('rareza', 30)->default('comun');
            $table->string('asset_capa', 255);
            $table->string('asset_miniatura', 255)->nullable();
            $table->smallInteger('orden_capa')->default(20);
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->index(['activo', 'slot']);
        });

        Schema::create('mascota_compatibilidades', function (Blueprint $table) {
            $table->foreignId('id_cosmetico')->constrained('mascota_cosmeticos')->cascadeOnDelete();
            $table->foreignId('id_especie')->constrained('mascota_especies')->cascadeOnDelete();
            $table->primary(['id_cosmetico', 'id_especie'], 'mascota_compatibilidad_pk');
        });

        Schema::create('mascotas_alumnos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_alumno')->unique()->constrained('usuarios')->cascadeOnDelete();
            $table->foreignId('id_especie')->constrained('mascota_especies')->restrictOnDelete();
            $table->string('nombre', 30)->default('Nexo');
            $table->timestamps();
        });

        Schema::create('mascota_inventario', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_alumno')->constrained('usuarios')->cascadeOnDelete();
            $table->foreignId('id_cosmetico')->constrained('mascota_cosmeticos')->restrictOnDelete();
            $table->foreignId('id_canje')->nullable()->unique()->constrained('canjes')->nullOnDelete();
            $table->string('fuente', 30)->default('tienda');
            $table->timestamps();
            $table->unique(['id_alumno', 'id_cosmetico'], 'mascota_inventario_unico');
            $table->index(['id_alumno', 'created_at']);
        });

        Schema::create('mascota_equipamientos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_mascota')->constrained('mascotas_alumnos')->cascadeOnDelete();
            $table->string('slot', 30);
            $table->foreignId('id_cosmetico')->constrained('mascota_cosmeticos')->restrictOnDelete();
            $table->timestamps();
            $table->unique(['id_mascota', 'slot'], 'mascota_equipamiento_slot_unico');
            $table->unique(['id_mascota', 'id_cosmetico'], 'mascota_equipamiento_item_unico');
        });

        DB::table('mascota_especies')->insert([
            'codigo' => 'daemon-origen',
            'nombre' => 'Monstruo DAEMON',
            'descripcion' => 'La criatura original de la comunidad DAEMON.',
            'asset_base' => 'img/hero-monster.png',
            'asset_miniatura' => 'img/hero-monster.png',
            'lienzo_ancho' => 1024,
            'lienzo_alto' => 1024,
            'orden' => 10,
            'activo' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('mascota_equipamientos');
        Schema::dropIfExists('mascota_inventario');
        Schema::dropIfExists('mascotas_alumnos');
        Schema::dropIfExists('mascota_compatibilidades');
        Schema::dropIfExists('mascota_cosmeticos');
        Schema::dropIfExists('mascota_especies');
    }
};
