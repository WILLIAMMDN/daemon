<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AplicarRetencionPrivacidad extends Command
{
    protected $signature = 'daemon:aplicar-retencion {--confirm : Eliminar los registros elegibles}';

    protected $description = 'Aplica la retencion de datos efimeros sin tocar historial academico';

    public function handle(): int
    {
        $consultas = $this->consultas();

        $this->table(
            ['categoria', 'registros elegibles'],
            collect($consultas)->map(fn ($consulta, string $nombre): array => [$nombre, $consulta->count()])->values(),
        );

        if (! $this->option('confirm')) {
            $this->warn('Simulacion: no se elimino ningun registro. Usa --confirm para aplicar.');

            return self::SUCCESS;
        }

        $eliminados = 0;
        DB::transaction(function () use ($consultas, &$eliminados): void {
            foreach ($consultas as $consulta) {
                $eliminados += $consulta->delete();
            }
        });

        $this->info("Retencion aplicada: {$eliminados} registros efimeros eliminados.");

        return self::SUCCESS;
    }

    /** @return array<string, \Illuminate\Database\Query\Builder> */
    private function consultas(): array
    {
        $consultas = [];

        if (Schema::hasTable('notificaciones')) {
            $consultas['notificaciones leidas'] = DB::table('notificaciones')
                ->where('leida', true)
                ->where('updated_at', '<', now()->subDays((int) config('privacy.retention.read_notifications_days')));
        }

        if (Schema::hasTable('failed_jobs')) {
            $consultas['jobs fallidos'] = DB::table('failed_jobs')
                ->where('failed_at', '<', now()->subHours((int) config('privacy.retention.failed_jobs_hours')));
        }

        if (Schema::hasTable('solicitudes_privacidad')) {
            $consultas['solicitudes resueltas'] = DB::table('solicitudes_privacidad')
                ->whereIn('estado', ['completada', 'rechazada'])
                ->where('resuelto_at', '<', now()->subDays((int) config('privacy.retention.resolved_requests_days')));
        }

        if (Schema::hasTable('uso_pantalla_diario')) {
            $consultas['uso de pantalla diario'] = DB::table('uso_pantalla_diario')
                ->where('fecha_local', '<', now()->subDays((int) config('privacy.retention.screen_usage_days'))->toDateString());
        }

        return $consultas;
    }
}
