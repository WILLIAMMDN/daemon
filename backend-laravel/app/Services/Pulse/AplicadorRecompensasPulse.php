<?php

namespace App\Services\Pulse;

use App\Models\AplicacionPoliticaPulse;
use App\Models\EventoDominio;
use App\Models\PoliticaRecompensaPulse;
use App\Models\Usuario;
use App\Services\Economia\EconomiaService;

class AplicadorRecompensasPulse
{
    public function __construct(
        private readonly EconomiaService $economia,
        private readonly ZonaHorariaPulse $zonas,
        private readonly RachasPulse $rachas,
    ) {}

    public function aplicar(
        EventoDominio $evento,
        PoliticaRecompensaPulse $politica,
        Usuario $usuario,
    ): ?AplicacionPoliticaPulse {
        $usuario = Usuario::whereKey($usuario->id)->lockForUpdate()->firstOrFail();
        $zona = $this->zonas->resolver($usuario);
        $fechaLocal = $this->zonas->fechaLocal($evento, $zona);
        $claveRepeticion = $this->claveRepeticion($evento, $politica, $usuario, $fechaLocal->toDateString());

        if (AplicacionPoliticaPulse::where('id_evento_dominio', $evento->id)->where('id_politica', $politica->id)->exists()
            || AplicacionPoliticaPulse::where('clave_repeticion', $claveRepeticion)->exists()) {
            return null;
        }

        if ($politica->limite_diario && AplicacionPoliticaPulse::query()
            ->where('id_usuario', $usuario->id)
            ->where('id_politica', $politica->id)
            ->whereDate('fecha_local', $fechaLocal->toDateString())
            ->count() >= $politica->limite_diario) {
            return null;
        }

        $claveLedger = "pulse:event:{$evento->uuid}:policy:{$politica->clave}:player:{$usuario->id}";
        $contexto = [
            'domainEventUuid' => $evento->uuid,
            'domainEventType' => $evento->tipo,
            'policyKey' => $politica->clave,
            'courseVersionId' => $evento->id_version_curso,
            'pathId' => $evento->payload['pathId'] ?? null,
            'experienceId' => $evento->payload['experienceId'] ?? null,
        ];
        $this->economia->otorgarPulse(
            $usuario,
            $politica->xp,
            $politica->daems,
            $evento->tipo,
            $evento->uuid,
            $claveLedger,
            $evento->id,
            $politica->id,
            $evento->id_matricula,
            $contexto,
        );

        $aplicacion = AplicacionPoliticaPulse::create([
            'id_evento_dominio' => $evento->id,
            'id_politica' => $politica->id,
            'id_usuario' => $usuario->id,
            'id_matricula' => $evento->id_matricula,
            'clave_repeticion' => $claveRepeticion,
            'fecha_local' => $fechaLocal->toDateString(),
            'contexto' => $contexto,
            'aplicado_at' => now(),
        ]);

        if ($politica->actividad_racha) {
            $this->rachas->registrar($usuario, $evento, $politica, $fechaLocal, $zona);
        }

        return $aplicacion;
    }

    private function claveRepeticion(
        EventoDominio $evento,
        PoliticaRecompensaPulse $politica,
        Usuario $usuario,
        string $fechaLocal,
    ): string {
        $base = "pulse:policy:{$politica->id}:player:{$usuario->id}";

        return match ($politica->repetibilidad) {
            'once_per_player' => $base,
            'once_per_source' => "{$base}:source:{$evento->agregado_tipo}:{$evento->agregado_id}",
            'daily' => "{$base}:day:{$fechaLocal}",
            default => "{$base}:event:{$evento->id}",
        };
    }
}
