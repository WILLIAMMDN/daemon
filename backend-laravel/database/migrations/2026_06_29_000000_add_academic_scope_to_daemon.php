<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('instituciones')) {
            Schema::create('instituciones', function (Blueprint $table): void {
                $table->id();
                $table->string('nombre', 150);
                $table->string('slug', 120)->unique();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('aulas')) {
            Schema::create('aulas', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('id_institucion')->nullable()->constrained('instituciones')->nullOnDelete();
                $table->string('nombre', 120);
                $table->string('nivel', 20)->nullable();
                $table->string('codigo', 40)->nullable()->unique();
                $table->timestamps();
                $table->index(['id_institucion', 'nivel']);
            });
        }

        if (! Schema::hasTable('usuarios')) {
            return;
        }

        Schema::table('usuarios', function (Blueprint $table): void {
            if (! Schema::hasColumn('usuarios', 'id_institucion')) {
                $table->foreignId('id_institucion')->nullable()->constrained('instituciones')->nullOnDelete();
            }

            if (! Schema::hasColumn('usuarios', 'id_aula')) {
                $table->foreignId('id_aula')->nullable()->constrained('aulas')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('usuarios')) {
            Schema::table('usuarios', function (Blueprint $table): void {
                if (Schema::hasColumn('usuarios', 'id_aula')) {
                    $table->dropConstrainedForeignId('id_aula');
                }

                if (Schema::hasColumn('usuarios', 'id_institucion')) {
                    $table->dropConstrainedForeignId('id_institucion');
                }
            });
        }

        Schema::dropIfExists('aulas');
        Schema::dropIfExists('instituciones');
    }
};
