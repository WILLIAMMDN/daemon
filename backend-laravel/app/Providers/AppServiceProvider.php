<?php

namespace App\Providers;

use App\Contracts\Cuento\CuentoDocumentoGateway;
use App\Contracts\Cuento\GeneradorTextoCuento;
use App\Services\Cuento\FirestoreRestCuentoGateway;
use App\Services\Cuento\ProveedorChatCuentoAdapter;
use App\Support\Autoria\AlcanceAutoria;
use App\Support\EnvironmentSafety;
use Illuminate\Database\Console\Migrations\FreshCommand;
use Illuminate\Database\Console\Migrations\RefreshCommand;
use Illuminate\Database\Console\Migrations\ResetCommand;
use Illuminate\Database\Console\Migrations\RollbackCommand;
use Illuminate\Database\Console\WipeCommand;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(CuentoDocumentoGateway::class, FirestoreRestCuentoGateway::class);
        $this->app->bind(GeneradorTextoCuento::class, ProveedorChatCuentoAdapter::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        EnvironmentSafety::fromApplication()->assertRuntimeSafe();

        // En el contenedor Docker de Render, cada llamada Http() de Laravel
        // abre una conexion nueva (sin pool) y el intento IPv6 previo al
        // fallback IPv4 puede tardar ~1.5 s por conexion. Forzar IPv4 y
        // acotar timeouts evita que operaciones con varias llamadas a
        // Firestore (guardar borrador ~6) tarden 10+ s.
        Http::globalOptions([
            'curl' => [CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4],
            'connect_timeout' => 5,
            'timeout' => 20,
        ]);

        Model::preventLazyLoading(! app()->isProduction());

        // `sanctum.expiration` es una ventana deslizante pensada para la sesion
        // de navegador. Un token de servicio headless (MCP) no tiene sesion: se
        // rige por su propio `expires_at`, que el comando de emision siempre
        // fija. Sigue siendo finito, hasheado y revocable; los tokens
        // interactivos conservan exactamente la regla anterior.
        Sanctum::authenticateAccessTokensUsing(
            static fn ($token, bool $esValido): bool => AlcanceAutoria::esTokenDeServicioValido($token) ?: $esValido,
        );

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
