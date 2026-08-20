<?php

namespace App\Services\Academico;

use App\Models\Aula;
use App\Models\Evaluacion;
use App\Models\Institucion;
use App\Models\Leccion;
use App\Models\MatriculaAula;
use App\Models\Mision;
use App\Models\ObjetivoAprendizaje;
use App\Models\Usuario;
use Illuminate\Database\Eloquent\Builder;

class AlineacionAcademicaService
{
    /**
     * Resuelve el alcance institucional y los objetivos sin confiar en ids enviados
     * por el cliente. Los registros legacy sin alcance siguen siendo visibles, pero
     * solo un administrador puede modificarlos.
     *
     * @return array{datos: array<string, mixed>, objetivos: ?array<int, int>}
     */
    public function resolver(Usuario $actor, array $datos, Mision|Evaluacion|null $actual = null): array
    {
        $institucionId = $this->valorId($datos, 'id_institucion', $actual?->id_institucion);
        $aulaId = $this->valorId($datos, 'id_aula', $actual?->id_aula);
        $leccionId = $this->valorId($datos, 'id_leccion', $actual?->id_leccion);
        $leccion = $leccionId ? Leccion::with('unidad.curso', 'objetivos')->findOrFail($leccionId) : null;
        $aula = $aulaId ? Aula::findOrFail($aulaId) : null;

        if ($leccion) {
            $institucionLeccion = (int) $leccion->unidad->curso->id_institucion;
            abort_if($institucionId && $institucionId !== $institucionLeccion, 422, 'La lección pertenece a otra institución.');
            $institucionId = $institucionLeccion;
        }

        if ($aula) {
            abort_if($institucionId && (int) $aula->id_institucion !== $institucionId, 422, 'El aula pertenece a otra institución.');
            abort_if(
                $leccion && $aula->id_curso && (int) $aula->id_curso !== (int) $leccion->unidad->curso->id,
                422,
                'El aula y la lección pertenecen a cursos distintos.',
            );
            $institucionId = (int) $aula->id_institucion;
        }

        if (! $institucionId && $actor->id_institucion) {
            $institucionId = (int) $actor->id_institucion;
        }

        if ($institucionId) {
            $this->autorizarInstitucion($actor, $institucionId);
        }

        if ($actor->rol === 'docente') {
            $aulasDocente = $this->aulasUsuario($actor);
            abort_if($aulasDocente === [], 403, 'El docente necesita un aula asignada para crear contenido académico.');
            abort_if($aulaId && ! in_array($aulaId, $aulasDocente, true), 403, 'No puedes administrar contenido de otra aula.');
            $aulaId ??= $actor->id_aula ? (int) $actor->id_aula : $aulasDocente[0];
            $aula = Aula::findOrFail($aulaId);
            abort_if($institucionId && (int) $aula->id_institucion !== $institucionId, 422, 'El aula no pertenece a la institución seleccionada.');
            $institucionId = (int) $aula->id_institucion;
        }

        $objetivos = null;
        if (array_key_exists('objetivos', $datos)) {
            $objetivos = array_values(array_unique(array_map('intval', $datos['objetivos'] ?? [])));
        } elseif (! $actual && $leccion) {
            $objetivos = $leccion->objetivos->modelKeys();
        }

        if ($objetivos !== null && $objetivos !== []) {
            $encontrados = ObjetivoAprendizaje::whereIn('id', $objetivos)->get(['id', 'id_institucion']);
            abort_unless($encontrados->count() === count($objetivos), 422, 'Uno o más objetivos no existen.');
            $instituciones = $encontrados->pluck('id_institucion')->map(fn ($id) => (int) $id)->unique();
            abort_unless($instituciones->count() === 1, 422, 'Los objetivos deben pertenecer a una sola institución.');
            $institucionObjetivos = (int) $instituciones->first();
            abort_if($institucionId && $institucionObjetivos !== $institucionId, 422, 'Los objetivos pertenecen a otra institución.');
            $institucionId = $institucionObjetivos;
            $this->autorizarInstitucion($actor, $institucionId);

            if ($leccion) {
                $objetivosLeccion = $leccion->objetivos->modelKeys();
                abort_if(array_diff($objetivos, $objetivosLeccion), 422, 'Cada objetivo debe estar vinculado previamente a la lección.');
            }
        }

        unset($datos['objetivos']);
        $datos['id_institucion'] = $institucionId;
        $datos['id_aula'] = $aulaId;
        $datos['id_leccion'] = $leccionId;

        return ['datos' => $datos, 'objetivos' => $objetivos];
    }

    public function autorizarGestion(Usuario $actor, Mision|Evaluacion $actividad): void
    {
        if ($actor->rol === 'admin') {
            return;
        }

        if (! $actividad->id_institucion) {
            $unicaInstitucion = Institucion::query()->count() === 1 ? Institucion::query()->value('id') : null;
            abort_unless(
                $unicaInstitucion && (int) $actor->id_institucion === (int) $unicaInstitucion,
                403,
                'Solo un administrador puede modificar contenido legacy con institución ambigua.',
            );

            return;
        }
        $this->autorizarInstitucion($actor, (int) $actividad->id_institucion);
        if ($actividad->id_aula) {
            abort_unless(in_array((int) $actividad->id_aula, $this->aulasUsuario($actor), true), 403, 'No puedes administrar contenido de otra aula.');
        }
    }

    public function aplicarVisibilidad(Builder $query, Usuario $usuario): Builder
    {
        if ($usuario->rol === 'admin') {
            return $query;
        }

        $aulas = collect($this->aulasUsuario($usuario));
        $legacyGlobalVisible = Institucion::query()->count() === 1;

        return $query
            ->where(function (Builder $sub) use ($usuario, $legacyGlobalVisible): void {
                if ($legacyGlobalVisible) {
                    $sub->whereNull('id_institucion');
                } else {
                    $sub->whereRaw('1 = 0');
                }
                if ($usuario->id_institucion) {
                    $sub->orWhere('id_institucion', $usuario->id_institucion);
                }
            })
            ->where(function (Builder $sub) use ($aulas): void {
                $sub->whereNull('id_aula');
                if ($aulas->isNotEmpty()) {
                    $sub->orWhereIn('id_aula', $aulas);
                }
            });
    }

    private function valorId(array $datos, string $clave, mixed $actual): ?int
    {
        $valor = array_key_exists($clave, $datos) ? $datos[$clave] : $actual;

        return filled($valor) ? (int) $valor : null;
    }

    /** @return array<int, int> */
    private function aulasUsuario(Usuario $usuario): array
    {
        $ids = MatriculaAula::where('id_usuario', $usuario->id)
            ->where('estado', 'active')
            ->when($usuario->rol === 'docente', fn ($query) => $query->where('rol', 'teacher'))
            ->when($usuario->rol === 'alumno', fn ($query) => $query->where('rol', 'student'))
            ->pluck('id_aula');
        if ($usuario->id_aula) {
            $ids->push($usuario->id_aula);
        }

        return $ids->map(fn ($id) => (int) $id)->unique()->values()->all();
    }

    private function autorizarInstitucion(Usuario $actor, int $institucionId): void
    {
        if ($actor->rol === 'admin') {
            return;
        }

        abort_unless((int) $actor->id_institucion === $institucionId, 403, 'No puedes administrar otra institución.');
    }
}
