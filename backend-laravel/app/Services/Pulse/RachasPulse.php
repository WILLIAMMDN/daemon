<?php

namespace App\Services\Pulse;

use App\Models\EventoDominio;
use App\Models\PoliticaRecompensaPulse;
use App\Models\RachaPulse;
use App\Models\Usuario;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class RachasPulse
{
    public function registrar(
        Usuario $usuario,
        EventoDominio $evento,
        PoliticaRecompensaPulse $politica,
        CarbonImmutable $fechaLocal,
        string $zonaHoraria,
    ): bool {
        $insertado = DB::table('pulse_dias_racha')->insertOrIgnore([
            'id_usuario' => $usuario->id,
            'id_evento_dominio' => $evento->id,
            'id_politica' => $politica->id,
            'fecha_local' => $fechaLocal->toDateString(),
            'zona_horaria' => $zonaHoraria,
            'calificado_at' => $evento->ocurrido_at,
            'created_at' => now(),
        ]);
        if ($insertado !== 1) {
            return false;
        }

        RachaPulse::firstOrCreate(['id_usuario' => $usuario->id], [
            'racha_actual' => 0,
            'racha_maxima' => 0,
            'zona_horaria' => $zonaHoraria,
        ]);
        $racha = RachaPulse::where('id_usuario', $usuario->id)->lockForUpdate()->firstOrFail();
        $ultima = $racha->ultima_fecha_local
            ? CarbonImmutable::createFromFormat('!Y-m-d', $racha->ultima_fecha_local->toDateString(), $zonaHoraria)
            : null;

        if (! $ultima) {
            $actual = 1;
        } elseif ($fechaLocal->equalTo($ultima->addDay())) {
            $actual = $racha->racha_actual + 1;
        } elseif ($fechaLocal->greaterThan($ultima->addDay())) {
            $actual = 1;
        } else {
            return true;
        }

        $racha->forceFill([
            'racha_actual' => $actual,
            'racha_maxima' => max($racha->racha_maxima, $actual),
            'ultima_fecha_local' => $fechaLocal->toDateString(),
            'zona_horaria' => $zonaHoraria,
        ])->save();

        return true;
    }
}
