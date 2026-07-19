<?php

namespace App\Services\Academico;

use App\Models\Aula;
use App\Models\Curso;
use App\Models\Leccion;
use App\Models\MatriculaAula;
use App\Models\ObjetivoAprendizaje;
use App\Models\PeriodoAcademico;
use App\Models\ProgresoLeccion;
use App\Models\UnidadCurso;
use App\Models\Usuario;
use App\Services\Eventos\OutboxService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AprendizajeService
{
    public function __construct(private readonly OutboxService $outbox) {}

    public function catalogo(Usuario $usuario): array
    {
        $cursos = Curso::query()
            ->with(['institucion', 'unidades.lecciones.objetivos'])
            ->withCount(['unidades', 'aulas'])
            ->when($usuario->rol !== 'admin', fn ($query) => $query->where('id_institucion', $usuario->id_institucion))
            ->orderBy('titulo')
            ->get();

        $periodos = PeriodoAcademico::query()
            ->when($usuario->rol !== 'admin', fn ($query) => $query->where('id_institucion', $usuario->id_institucion))
            ->orderByDesc('fecha_inicio')
            ->get();

        return ['cursos' => $cursos, 'periodos' => $periodos];
    }

    public function crearPeriodo(Usuario $actor, array $datos): PeriodoAcademico
    {
        $this->autorizarInstitucion($actor, (int) $datos['id_institucion']);
        if (! empty($datos['id_padre'])) {
            $padre = PeriodoAcademico::findOrFail($datos['id_padre']);
            abort_unless((int) $padre->id_institucion === (int) $datos['id_institucion'], 422, 'El período padre pertenece a otra institución.');
        }

        return PeriodoAcademico::create([...$datos, 'sourced_id' => (string) Str::uuid()]);
    }

    public function crearCurso(Usuario $actor, array $datos): Curso
    {
        $this->autorizarInstitucion($actor, (int) $datos['id_institucion']);

        return Curso::create([...$datos, 'sourced_id' => (string) Str::uuid()]);
    }

    public function actualizarCurso(Usuario $actor, Curso $curso, array $datos): Curso
    {
        $this->autorizarInstitucion($actor, (int) $curso->id_institucion);
        $this->autorizarInstitucion($actor, (int) $datos['id_institucion']);
        abort_if(
            (int) $curso->id_institucion !== (int) $datos['id_institucion'],
            422,
            'Un curso no puede trasladarse entre instituciones. Crea una copia controlada en la institución destino.',
        );
        $curso->fill($datos);
        if ($curso->isDirty(['titulo', 'codigo', 'descripcion', 'nivel'])) {
            $curso->version++;
        }
        if (($datos['estado'] ?? null) === 'published' && ! $curso->publicado_at) {
            $curso->publicado_at = now();
        }
        $curso->save();
        if ($curso->wasChanged('estado') && $curso->estado === 'published') {
            $this->outbox->registrar('academico.curso_publicado', 'curso', $curso->id, [
                'id_institucion' => $curso->id_institucion,
                'version' => $curso->version,
            ]);
        }

        return $curso->fresh(['unidades.lecciones.objetivos']);
    }

    public function crearUnidad(Usuario $actor, Curso $curso, array $datos): UnidadCurso
    {
        $this->autorizarInstitucion($actor, (int) $curso->id_institucion);

        return UnidadCurso::create([...$datos, 'id_curso' => $curso->id, 'uuid' => (string) Str::uuid()]);
    }

    public function actualizarUnidad(Usuario $actor, UnidadCurso $unidad, array $datos): UnidadCurso
    {
        $unidad->loadMissing('curso');
        $this->autorizarInstitucion($actor, (int) $unidad->curso->id_institucion);
        $unidad->update($datos);

        return $unidad->fresh('lecciones.objetivos');
    }

    public function crearLeccion(Usuario $actor, UnidadCurso $unidad, array $datos): Leccion
    {
        $unidad->loadMissing('curso');
        $this->autorizarInstitucion($actor, (int) $unidad->curso->id_institucion);
        $objetivos = $datos['objetivos'] ?? [];
        unset($datos['objetivos']);
        $this->validarObjetivosInstitucion($objetivos, (int) $unidad->curso->id_institucion);

        return DB::transaction(function () use ($unidad, $datos, $objetivos): Leccion {
            $leccion = Leccion::create([...$datos, 'id_unidad' => $unidad->id, 'uuid' => (string) Str::uuid()]);
            $leccion->objetivos()->sync($objetivos);

            return $leccion->fresh('objetivos');
        });
    }

    public function actualizarLeccion(Usuario $actor, Leccion $leccion, array $datos): Leccion
    {
        $leccion->loadMissing('unidad.curso');
        $this->autorizarInstitucion($actor, (int) $leccion->unidad->curso->id_institucion);
        $objetivos = $datos['objetivos'] ?? null;
        unset($datos['objetivos']);
        if ($objetivos !== null) {
            $this->validarObjetivosInstitucion($objetivos, (int) $leccion->unidad->curso->id_institucion);
        }

        return DB::transaction(function () use ($leccion, $datos, $objetivos): Leccion {
            $leccion->update($datos);
            if ($objetivos !== null) {
                $leccion->objetivos()->sync($objetivos);
            }

            return $leccion->fresh('objetivos');
        });
    }

    public function crearObjetivo(Usuario $actor, array $datos): ObjetivoAprendizaje
    {
        $this->autorizarInstitucion($actor, (int) $datos['id_institucion']);

        return ObjetivoAprendizaje::create([...$datos, 'uuid' => (string) Str::uuid()]);
    }

    public function matricular(Usuario $actor, Aula $aula, Usuario $usuario, array $datos): MatriculaAula
    {
        $this->autorizarInstitucion($actor, (int) $aula->id_institucion);
        abort_unless((int) $usuario->id_institucion === (int) $aula->id_institucion || ! $usuario->id_institucion, 422, 'El usuario pertenece a otra institución.');

        return DB::transaction(function () use ($aula, $usuario, $datos): MatriculaAula {
            if ($datos['es_principal'] ?? false) {
                MatriculaAula::where('id_usuario', $usuario->id)->update(['es_principal' => false]);
                $usuario->forceFill(['id_aula' => $aula->id, 'id_institucion' => $aula->id_institucion])->save();
            }

            $matricula = MatriculaAula::firstOrNew(['id_aula' => $aula->id, 'id_usuario' => $usuario->id, 'rol' => $datos['rol']]);
            $matricula->sourced_id ??= (string) Str::uuid();
            $matricula->fill([...$datos, 'estado' => $datos['estado'] ?? 'active'])->save();

            return $matricula->fresh();
        });
    }

    public function vincularAula(Usuario $actor, Aula $aula, Curso $curso, PeriodoAcademico $periodo): Aula
    {
        $this->autorizarInstitucion($actor, (int) $aula->id_institucion);
        abort_unless(
            (int) $curso->id_institucion === (int) $aula->id_institucion
            && (int) $periodo->id_institucion === (int) $aula->id_institucion,
            422,
            'Curso, período y aula deben pertenecer a la misma institución.',
        );
        $aula->update(['id_curso' => $curso->id, 'id_periodo_academico' => $periodo->id]);

        return $aula->fresh(['curso', 'periodoAcademico']);
    }

    public function aprendizajeAlumno(Usuario $alumno): array
    {
        $aulaIds = $this->aulasDelUsuario($alumno);
        $cursos = Curso::query()
            ->where('estado', 'published')
            ->whereHas('aulas', fn ($query) => $query->whereIn('aulas.id', $aulaIds))
            ->with([
                'unidades' => fn ($query) => $query->where('estado', 'published')->orderBy('orden'),
                'unidades.lecciones' => fn ($query) => $query->where('estado', 'published')->orderBy('orden'),
                'unidades.lecciones.objetivos',
                'unidades.lecciones.progresos' => fn ($query) => $query->where('id_alumno', $alumno->id),
            ])
            ->orderBy('titulo')
            ->get();

        return [
            'cursos' => $cursos,
            'resumen' => $this->resumenProgreso($cursos),
        ];
    }

    public function registrarProgreso(Usuario $alumno, Leccion $leccion, array $datos): ProgresoLeccion
    {
        $aulaIds = $this->aulasDelUsuario($alumno);
        $permitida = Leccion::query()
            ->whereKey($leccion->id)
            ->where('estado', 'published')
            ->whereHas('unidad.curso.aulas', fn ($query) => $query->whereIn('aulas.id', $aulaIds))
            ->exists();
        abort_unless($permitida, 403, 'La lección no pertenece a una matrícula activa.');

        if ($datos['estado'] === 'completed') {
            $datos['porcentaje'] = 100;
            $datos['completado_at'] = now();
        }
        if ($datos['estado'] === 'inProgress') {
            $datos['iniciado_at'] = now();
        }

        $progreso = ProgresoLeccion::updateOrCreate(
            ['id_leccion' => $leccion->id, 'id_alumno' => $alumno->id],
            $datos,
        );
        if (($progreso->wasRecentlyCreated || $progreso->wasChanged('estado')) && $progreso->estado === 'completed') {
            $this->outbox->registrar('academico.leccion_completada', 'leccion', $leccion->id, [
                'id_alumno' => $alumno->id,
                'id_institucion' => $alumno->id_institucion,
            ]);
        }

        return $progreso;
    }

    private function aulasDelUsuario(Usuario $usuario): Collection
    {
        $ids = MatriculaAula::where('id_usuario', $usuario->id)
            ->where('estado', 'active')
            ->pluck('id_aula');
        if ($usuario->id_aula) {
            $ids->push($usuario->id_aula);
        }

        return $ids->unique()->values();
    }

    private function resumenProgreso(Collection $cursos): array
    {
        $lecciones = $cursos->flatMap->unidades->flatMap->lecciones;
        $completadas = $lecciones->filter(fn (Leccion $leccion) => $leccion->progresos->first()?->estado === 'completed')->count();

        return [
            'cursos' => $cursos->count(),
            'lecciones' => $lecciones->count(),
            'completadas' => $completadas,
            'porcentaje' => $lecciones->count() ? (int) round($completadas * 100 / $lecciones->count()) : 0,
        ];
    }

    /** @param array<int, int|string> $objetivos */
    private function validarObjetivosInstitucion(array $objetivos, int $institucionId): void
    {
        if ($objetivos === []) {
            return;
        }

        $ids = array_values(array_unique(array_map('intval', $objetivos)));
        $validos = ObjetivoAprendizaje::whereIn('id', $ids)
            ->where('id_institucion', $institucionId)
            ->count();
        abort_unless($validos === count($ids), 422, 'Todos los objetivos deben pertenecer a la institución del curso.');
    }

    private function autorizarInstitucion(Usuario $actor, int $institucionId): void
    {
        if ($actor->rol === 'admin') {
            return;
        }

        abort_unless((int) $actor->id_institucion === $institucionId, 403, 'No puedes administrar otra institución.');
    }
}
