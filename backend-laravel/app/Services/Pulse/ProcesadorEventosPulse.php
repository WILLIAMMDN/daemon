<?php

namespace App\Services\Pulse;

use App\Models\EventoDominio;
use App\Models\ProcesamientoEventoPulse;
use App\Models\Usuario;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProcesadorEventosPulse
{
    public function __construct(
        private readonly PoliticasPulse $politicas,
        private readonly AplicadorRecompensasPulse $recompensas,
        private readonly EvaluadorLogrosPulse $logros,
    ) {}

    /** @return array{processed: int, failed: int, policies: int, achievements: int} */
    public function procesarPendientes(int $limite = 100): array
    {
        $maxIntentos = max(1, (int) config('pulse.max_processing_attempts', 5));
        $ids = EventoDominio::query()
            ->from('eventos_dominio as eventos')
            ->leftJoin('pulse_procesamientos_evento as procesamientos', 'procesamientos.id_evento_dominio', '=', 'eventos.id')
            ->whereIn('eventos.tipo', config('pulse.allowed_events', []))
            ->where(fn ($query) => $query
                ->whereNull('procesamientos.id')
                ->orWhere(fn ($query) => $query->where('procesamientos.estado', 'failed')->where('procesamientos.intentos', '<', $maxIntentos)))
            ->orderBy('eventos.id')
            ->limit(max(1, min($limite, 1000)))
            ->pluck('eventos.id');

        $resumen = ['processed' => 0, 'failed' => 0, 'policies' => 0, 'achievements' => 0];
        foreach ($ids as $id) {
            try {
                $resultado = $this->procesar((int) $id);
                $resumen['processed']++;
                $resumen['policies'] += $resultado['policies'];
                $resumen['achievements'] += $resultado['achievements'];
            } catch (Throwable) {
                $resumen['failed']++;
            }
        }

        return $resumen;
    }

    /** @return array{status: string, policies: int, achievements: int} */
    public function procesar(int $eventoId): array
    {
        try {
            return DB::transaction(function () use ($eventoId): array {
                $evento = EventoDominio::whereKey($eventoId)->lockForUpdate()->firstOrFail();
                abort_unless(in_array($evento->tipo, config('pulse.allowed_events', []), true), 422, 'El evento no es una entrada válida para Pulse.');

                ProcesamientoEventoPulse::firstOrCreate(
                    ['id_evento_dominio' => $evento->id],
                    ['estado' => 'pending', 'intentos' => 0],
                );
                $procesamiento = ProcesamientoEventoPulse::where('id_evento_dominio', $evento->id)->lockForUpdate()->firstOrFail();
                if ($procesamiento->estado === 'processed') {
                    return [
                        'status' => 'processed',
                        'policies' => $procesamiento->politicas_aplicadas,
                        'achievements' => $procesamiento->logros_otorgados,
                    ];
                }

                $procesamiento->forceFill([
                    'estado' => 'processing',
                    'intentos' => $procesamiento->intentos + 1,
                    'ultimo_error' => null,
                ])->save();

                $usuario = Usuario::whereKey($evento->id_alumno)->lockForUpdate()->first();
                if (! $usuario || $usuario->rol !== 'alumno') {
                    $procesamiento->forceFill(['estado' => 'processed', 'procesado_at' => now()])->save();

                    return ['status' => 'processed', 'policies' => 0, 'achievements' => 0];
                }

                $aplicadas = 0;
                foreach ($this->politicas->para($evento, $usuario) as $politica) {
                    $aplicadas += $this->recompensas->aplicar($evento, $politica, $usuario) ? 1 : 0;
                }
                $logros = $this->logros->evaluar($evento, $usuario);

                $procesamiento->forceFill([
                    'estado' => 'processed',
                    'politicas_aplicadas' => $aplicadas,
                    'logros_otorgados' => $logros,
                    'procesado_at' => now(),
                ])->save();

                return ['status' => 'processed', 'policies' => $aplicadas, 'achievements' => $logros];
            }, 3);
        } catch (Throwable $e) {
            $this->registrarFallo($eventoId, $e);
            throw $e;
        }
    }

    private function registrarFallo(int $eventoId, Throwable $error): void
    {
        DB::transaction(function () use ($eventoId, $error): void {
            $procesamiento = ProcesamientoEventoPulse::firstOrNew(['id_evento_dominio' => $eventoId]);
            $procesamiento->forceFill([
                'estado' => 'failed',
                'intentos' => ((int) $procesamiento->intentos) + 1,
                'ultimo_error' => mb_substr($error->getMessage(), 0, 2000),
            ])->save();
        });

        Log::error('DAEMON Pulse no pudo procesar un evento de dominio.', [
            'domain_event_id' => $eventoId,
            'error_class' => $error::class,
            'message' => $error->getMessage(),
        ]);
    }
}
