<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Marca de verificacion de correo electronico. Se setea cuando el
     * usuario hace clic en el enlace de "Confirma tu correo" que se
     * envia tras el registro clasico (email + clave). Login con Google
     * lo marca automaticamente porque Google ya verifico el correo.
     *
     * Nullable: NULL significa "aun no verificado". Cualquier timestamp
     * distinto de NULL = verificado en esa fecha.
     */
    public function up(): void
    {
        if (! Schema::hasTable('usuarios')) {
            return;
        }

        if (Schema::hasColumn('usuarios', 'email_verified_at')) {
            return;
        }

        Schema::table('usuarios', function (Blueprint $table): void {
            $table->timestamp('email_verified_at')->nullable()->after('email');
            $table->index('email_verified_at', 'usuarios_email_verified_at_index');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('usuarios') || ! Schema::hasColumn('usuarios', 'email_verified_at')) {
            return;
        }

        Schema::table('usuarios', function (Blueprint $table): void {
            $table->dropIndex('usuarios_email_verified_at_index');
            $table->dropColumn('email_verified_at');
        });
    }
};
