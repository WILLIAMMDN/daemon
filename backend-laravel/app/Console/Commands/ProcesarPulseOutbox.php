<?php

namespace App\Console\Commands;

use App\Services\Pulse\ProcesadorEventosPulse;
use Illuminate\Console\Command;
use Throwable;

class ProcesarPulseOutbox extends Command
{
    protected $signature = 'pulse:process-outbox {--limit=100} {--event=}';

    protected $description = 'Procesa eventos académicos server-side mediante DAEMON Pulse';

    public function handle(ProcesadorEventosPulse $procesador): int
    {
        if ($evento = $this->option('event')) {
            try {
                $this->line(json_encode($procesador->procesar((int) $evento), JSON_THROW_ON_ERROR));

                return self::SUCCESS;
            } catch (Throwable $e) {
                $this->error($e->getMessage());

                return self::FAILURE;
            }
        }

        $resumen = $procesador->procesarPendientes((int) $this->option('limit'));
        $this->info("Pulse: {$resumen['processed']} procesados, {$resumen['failed']} fallidos, {$resumen['policies']} políticas, {$resumen['achievements']} logros.");

        return $resumen['failed'] > 0 ? self::FAILURE : self::SUCCESS;
    }
}
