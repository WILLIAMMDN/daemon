<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('bots_alumnos')) {
            return;
        }

        DB::table('bots_alumnos')
            ->where('avatar', 'img/bot_default.png')
            ->update(['avatar' => 'img/bot_default.svg']);
    }

    public function down(): void
    {
        if (! Schema::hasTable('bots_alumnos')) {
            return;
        }

        DB::table('bots_alumnos')
            ->where('avatar', 'img/bot_default.svg')
            ->update(['avatar' => 'img/bot_default.png']);
    }
};
