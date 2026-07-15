<?php

namespace App\Services\Familias;

use App\Models\LimitePantalla;
use App\Models\UsoPantallaDiario;
use App\Models\Usuario;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class BienestarDigitalService
{
    /** @return array<string, mixed> */
    public function estadoPara(Usuario $alumno): array
    {
        $limite = LimitePantalla::query()->where('alumno_id', $alumno->id)->first();
        $zona = $limite?->zona_horaria ?: (string) config('daemon.familias.zona_horaria', 'America/Lima');
        $ahora = CarbonImmutable::now($zona);
        $segundos = (int) UsoPantallaDiario::query()
            ->where('alumno_id', $alumno->id)
            ->whereDate('fecha_local', $ahora->toDateString())
            ->value('segundos_activos');

        return $this->respuesta($limite, $ahora, $segundos);
    }

    /** @return array<string, mixed> */
    public function registrarUso(Usuario $alumno, int $segundos): array
    {
        return DB::transaction(function () use ($alumno, $segundos): array {
            $limite = LimitePantalla::query()
                ->where('alumno_id', $alumno->id)
                ->lockForUpdate()
                ->first();

            if (! $limite?->activo) {
                return $this->estadoPara($alumno);
            }

            $zona = $limite->zona_horaria ?: (string) config('daemon.familias.zona_horaria', 'America/Lima');
            $ahora = CarbonImmutable::now($zona);
            $uso = UsoPantallaDiario::query()
                ->where('alumno_id', $alumno->id)
                ->whereDate('fecha_local', $ahora->toDateString())
                ->lockForUpdate()
                ->first();

            if (! $uso) {
                UsoPantallaDiario::query()->insertOrIgnore([
                    'alumno_id' => $alumno->id,
                    'fecha_local' => $ahora->toDateString(),
                    'segundos_activos' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $uso = UsoPantallaDiario::query()
                    ->where('alumno_id', $alumno->id)
                    ->whereDate('fecha_local', $ahora->toDateString())
                    ->lockForUpdate()
                    ->firstOrFail();
            }

            $estado = $this->respuesta($limite, $ahora, (int) $uso->segundos_activos);
            if (! $estado['bloqueado']) {
                $maximo = (int) $limite->max_minutos_diarios * 60;
                $uso->segundos_activos = min($maximo, (int) $uso->segundos_activos + min(60, max(15, $segundos)));
                $uso->save();
            }

            return $this->respuesta($limite, $ahora, (int) $uso->segundos_activos);
        });
    }

    /** @return array<string, mixed> */
    private function respuesta(?LimitePantalla $limite, CarbonImmutable $ahora, int $segundos): array
    {
        $activo = (bool) ($limite?->activo ?? false);
        $enSilencio = $activo && $this->enHorarioSilencio($limite, $ahora);
        $maximoSegundos = $limite ? (int) $limite->max_minutos_diarios * 60 : null;
        $agotado = $activo && $maximoSegundos !== null && $segundos >= $maximoSegundos;
        $motivo = $enSilencio ? 'horario_silencio' : ($agotado ? 'limite_diario' : null);

        return [
            'activo' => $activo,
            'bloqueado' => $motivo !== null,
            'motivo' => $motivo,
            'mensaje' => match ($motivo) {
                'horario_silencio' => 'Es hora de descansar. Tu familia configuro este horario de pausa.',
                'limite_diario' => 'Completaste el tiempo de DAEMON de hoy. Tu progreso quedo guardado.',
                default => null,
            },
            'fecha_local' => $ahora->toDateString(),
            'zona_horaria' => $limite?->zona_horaria ?? $ahora->getTimezone()->getName(),
            'minutos_usados' => (int) ceil($segundos / 60),
            'max_minutos_diarios' => $limite?->max_minutos_diarios,
            'minutos_restantes' => $maximoSegundos === null ? null : max(0, (int) ceil(($maximoSegundos - $segundos) / 60)),
            'hora_silencio_inicio' => $limite?->hora_silencio_inicio,
            'hora_silencio_fin' => $limite?->hora_silencio_fin,
        ];
    }

    private function enHorarioSilencio(LimitePantalla $limite, CarbonImmutable $ahora): bool
    {
        if (! $limite->hora_silencio_inicio || ! $limite->hora_silencio_fin) {
            return false;
        }

        $actual = $ahora->format('H:i');
        $inicio = substr((string) $limite->hora_silencio_inicio, 0, 5);
        $fin = substr((string) $limite->hora_silencio_fin, 0, 5);

        return $inicio <= $fin
            ? $actual >= $inicio && $actual < $fin
            : $actual >= $inicio || $actual < $fin;
    }
}
