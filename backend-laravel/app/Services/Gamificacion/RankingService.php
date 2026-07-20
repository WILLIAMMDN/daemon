<?php

namespace App\Services\Gamificacion;

use App\Models\Usuario;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class RankingService
{
    /**
     * El ranking del alumno siempre es visible, pero se limita a su contexto
     * academico para que la comparacion sea relevante y privada por defecto.
     */
    public function consultaPara(Usuario $usuario): Builder
    {
        $consulta = Usuario::query()->where('rol', 'alumno');

        if ($usuario->id_aula) {
            return $consulta->where('id_aula', $usuario->id_aula);
        }

        if ($usuario->id_institucion) {
            return $consulta
                ->where('id_institucion', $usuario->id_institucion)
                ->where('nivel', $usuario->nivel);
        }

        return $consulta->where('nivel', $usuario->nivel);
    }

    /** @return Collection<int, Usuario> */
    public function alumnosPara(Usuario $usuario): Collection
    {
        return $this->consultaPara($usuario)
            ->select('id', 'nombre_completo', 'nivel', 'experiencia', 'rango', 'avatar', 'id_aula', 'id_institucion')
            ->orderByDesc('experiencia')
            ->orderByRaw("COALESCE(nombre_completo, '') ASC")
            ->orderBy('id')
            ->get();
    }

    public function posicionDe(Usuario $usuario): int
    {
        return $this->consultaPara($usuario)
            ->where(function (Builder $query) use ($usuario): void {
                $nombreUsuario = $usuario->nombre_completo ?? '';
                $query->where('experiencia', '>', (int) $usuario->experiencia)
                    ->orWhere(function (Builder $q) use ($usuario, $nombreUsuario): void {
                        $q->where('experiencia', '=', (int) $usuario->experiencia)
                            ->whereRaw("COALESCE(nombre_completo, '') < ?", [$nombreUsuario]);
                    })
                    ->orWhere(function (Builder $q) use ($usuario, $nombreUsuario): void {
                        $q->where('experiencia', '=', (int) $usuario->experiencia)
                            ->whereRaw("COALESCE(nombre_completo, '') = ?", [$nombreUsuario])
                            ->where('id', '<', $usuario->id);
                    });
            })
            ->count() + 1;
    }

    /** @return array{codigo: string, etiqueta: string} */
    public function alcanceDe(Usuario $usuario): array
    {
        if ($usuario->id_aula) {
            return ['codigo' => 'aula', 'etiqueta' => 'Tu aula'];
        }

        if ($usuario->id_institucion) {
            return ['codigo' => 'institucion_nivel', 'etiqueta' => "Tu institucion · {$usuario->nivel}"];
        }

        return ['codigo' => 'nivel', 'etiqueta' => "Nivel {$usuario->nivel}"];
    }

    public function nombreMostrado(Usuario $usuario): string
    {
        $partes = preg_split('/\s+/', trim((string) $usuario->nombre_completo), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        if ($partes === []) {
            return 'Explorador DAEMON';
        }

        if (count($partes) === 1) {
            return $partes[0];
        }

        return sprintf('%s %s.', $partes[0], mb_strtoupper(mb_substr($partes[count($partes) - 1], 0, 1)));
    }
}
