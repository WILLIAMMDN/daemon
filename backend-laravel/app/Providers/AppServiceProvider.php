<?php

namespace App\Providers;

use Illuminate\Database\Console\Migrations\FreshCommand;
use Illuminate\Database\Console\Migrations\RefreshCommand;
use Illuminate\Database\Console\Migrations\ResetCommand;
use Illuminate\Database\Console\Migrations\RollbackCommand;
use Illuminate\Database\Console\WipeCommand;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Model::preventLazyLoading(! app()->isProduction());

        // Una etiqueta APP_ENV incorrecta nunca debe habilitar comandos que
        // destruyen una base Supabase. Las migraciones incrementales siguen
        // permitidas para el despliegue normal de Render.
        $conexion = config('database.default');
        $host = strtolower((string) config("database.connections.{$conexion}.host"));
        $url = strtolower((string) config("database.connections.{$conexion}.url"));
        if (str_contains($host, '.supabase.com') || str_contains($url, '.supabase.com')) {
            FreshCommand::prohibit();
            RefreshCommand::prohibit();
            ResetCommand::prohibit();
            RollbackCommand::prohibit();
            WipeCommand::prohibit();
        }
    }
}
