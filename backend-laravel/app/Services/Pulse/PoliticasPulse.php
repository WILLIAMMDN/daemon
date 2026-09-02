<?php

namespace App\Services\Pulse;

use App\Models\EventoDominio;
use App\Models\PoliticaRecompensaPulse;
use App\Models\Usuario;
use Illuminate\Support\Collection;

class PoliticasPulse
{
    /** @return Collection<int, PoliticaRecompensaPulse> */
    public function para(EventoDominio $evento, Usuario $usuario): Collection
    {
        $payload = $evento->payload ?? [];
        $ocurrido = $evento->ocurrido_at;

        return PoliticaRecompensaPulse::query()
            ->where('activa', true)
            ->where('tipo_evento', $evento->tipo)
            ->where(fn ($query) => $query->whereNull('vigente_desde')->orWhere('vigente_desde', '<=', $ocurrido))
            ->where(fn ($query) => $query->whereNull('vigente_hasta')->orWhere('vigente_hasta', '>=', $ocurrido))
            ->where(fn ($query) => $query->whereNull('tipo_experiencia')->orWhere('tipo_experiencia', $payload['experienceType'] ?? null))
            ->where(fn ($query) => $query->whereNull('id_version_curso')->orWhere('id_version_curso', $evento->id_version_curso ?? ($payload['courseVersionId'] ?? null)))
            ->where(fn ($query) => $query->whereNull('id_ruta_aprendizaje')->orWhere('id_ruta_aprendizaje', $payload['pathId'] ?? null))
            ->orderBy('id')
            ->get()
            ->filter(fn (PoliticaRecompensaPulse $politica): bool => $this->elegible($politica, $evento, $usuario))
            ->values();
    }

    private function elegible(PoliticaRecompensaPulse $politica, EventoDominio $evento, Usuario $usuario): bool
    {
        if ($usuario->rol !== 'alumno') {
            return false;
        }

        $reglas = $politica->reglas_elegibilidad ?? [];
        $audiencias = $reglas['audiencias'] ?? [];
        if ($audiencias && ! in_array($usuario->nivel, $audiencias, true)) {
            return false;
        }

        if (array_key_exists('puntaje_minimo', $reglas)) {
            $puntaje = $evento->payload['score'] ?? $evento->payload['puntaje'] ?? null;
            if ($puntaje === null || (float) $puntaje < (float) $reglas['puntaje_minimo']) {
                return false;
            }
        }

        return true;
    }
}
