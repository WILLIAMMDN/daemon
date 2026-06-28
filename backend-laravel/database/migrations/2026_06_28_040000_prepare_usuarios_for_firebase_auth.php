<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('usuarios')) {
            return;
        }

        Schema::table('usuarios', function (Blueprint $table): void {
            if (! Schema::hasColumn('usuarios', 'firebase_uid')) {
                $after = Schema::hasColumn('usuarios', 'google_id') ? 'google_id' : 'email';
                $table->string('firebase_uid', 128)->nullable()->unique()->after($after);
            }

            if (! Schema::hasColumn('usuarios', 'telefono')) {
                $table->string('telefono', 30)->nullable()->unique()->after('email');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('usuarios')) {
            return;
        }

        Schema::table('usuarios', function (Blueprint $table): void {
            if (Schema::hasColumn('usuarios', 'firebase_uid')) {
                $table->dropUnique('usuarios_firebase_uid_unique');
                $table->dropColumn('firebase_uid');
            }

            if (Schema::hasColumn('usuarios', 'telefono')) {
                $table->dropUnique('usuarios_telefono_unique');
                $table->dropColumn('telefono');
            }
        });
    }
};
