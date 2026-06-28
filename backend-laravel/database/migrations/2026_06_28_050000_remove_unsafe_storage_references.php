<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** @var array<int, string> */
    private array $campos = ['avatar', 'fondo', 'heroe'];

    /** @var array<int, string> */
    private array $extensionesInseguras = ['exe', 'bat', 'cmd', 'com', 'msi', 'ps1', 'scr', 'vbs'];

    public function up(): void
    {
        if (! Schema::hasTable('usuarios')) {
            return;
        }

        DB::table('usuarios')
            ->where('fondo', 'uploads/fondos/bg_28_1771342163.exe')
            ->update(['fondo' => 'uploads/fondos/bg_28_1770999179.jpg']);

        foreach ($this->campos as $campo) {
            if (! Schema::hasColumn('usuarios', $campo)) {
                continue;
            }

            foreach ($this->extensionesInseguras as $extension) {
                DB::table('usuarios')
                    ->where($campo, 'like', '%.'.$extension)
                    ->update([$campo => null]);
            }
        }
    }

    public function down(): void
    {
        // No se restauran referencias a archivos ejecutables por seguridad.
    }
};
