<?php

namespace App\Services\Pulse;

use App\Models\EventoDominio;
use App\Models\Usuario;
use Carbon\CarbonImmutable;
use DateTimeZone;
use Illuminate\Support\Facades\DB;
use Throwable;

class ZonaHorariaPulse
{
    public function resolver(Usuario $usuario): string
    {
        $zona = DB::table('limites_pantalla')
            ->where('alumno_id', $usuario->id)
            ->value('zona_horaria');

        return $this->valida((string) ($zona ?: config('pulse.default_timezone', 'UTC')));
    }

    public function fechaLocal(EventoDominio $evento, string $zonaHoraria): CarbonImmutable
    {
        return CarbonImmutable::instance($evento->ocurrido_at)
            ->setTimezone($this->valida($zonaHoraria))
            ->startOfDay();
    }

    private function valida(string $zonaHoraria): string
    {
        try {
            new DateTimeZone($zonaHoraria);

            return $zonaHoraria;
        } catch (Throwable) {
            return 'UTC';
        }
    }
}
