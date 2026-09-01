<?php

namespace App\Services\Academico;

use App\Enums\AudienciaAprendizaje;
use App\Models\Aula;
use App\Models\Curso;
use App\Models\Leccion;
use App\Models\MatriculaAula;
use App\Models\ObjetivoAprendizaje;
use App\Models\PeriodoAcademico;
use App\Models\ProgresoLeccion;
use App\Models\RutaAprendizaje;
use App\Models\SesionAprendizaje;
use App\Models\UnidadCurso;
use App\Models\Usuario;
use App\Services\Eventos\OutboxService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AprendizajeService
{
    public function __construct(
        private readonly OutboxService $outbox,
        private readonly LearningProgressionService $progresion,
    ) {}

    public function catalogo(Usuario $usuario): array
    {
        $cursos = Curso::query()
            ->with(['institucion', 'versiones.unidades.lecciones.objetivos', 'unidades.lecciones.objetivos'])
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
        $unidad->loadMissing(['curso', 'versionCurso']);
        $this->autorizarInstitucion($actor, (int) $unidad->curso->id_institucion);
        abort_if($unidad->versionCurso?->estado === 'published', 409, 'No se puede modificar una unidad de una versión publicada.');
        $unidad->update($datos);

        return $unidad->fresh('lecciones.objetivos');
    }

    public function crearLeccion(Usuario $actor, UnidadCurso $unidad, array $datos): Leccion
    {
        $unidad->loadMissing(['curso', 'versionCurso']);
        $this->autorizarInstitucion($actor, (int) $unidad->curso->id_institucion);
        abort_if($unidad->versionCurso?->estado === 'published', 409, 'No se puede agregar contenido a una versión publicada.');
        $objetivos = $datos['objetivos'] ?? [];
        unset($datos['objetivos']);

        return DB::transaction(function () use ($unidad, $datos, $objetivos): Leccion {
            $leccion = Leccion::create([...$datos, 'id_unidad' => $unidad->id, 'uuid' => (string) Str::uuid()]);
            $leccion->objetivos()->sync($objetivos);

            return $leccion->fresh('objetivos');
        });
    }

    public function actualizarLeccion(Usuario $actor, Leccion $leccion, array $datos): Leccion
    {
        $leccion->loadMissing(['unidad.curso', 'unidad.versionCurso']);
        $this->autorizarInstitucion($actor, (int) $leccion->unidad->curso->id_institucion);
        abort_if($leccion->unidad->versionCurso?->estado === 'published', 409, 'No se puede modificar contenido de una versión publicada.');
        $objetivos = $datos['objetivos'] ?? null;
        unset($datos['objetivos']);

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
            if (! $matricula->exists) {
                $matricula->id_version_curso = $aula->id_version_curso;
                $matricula->id_ruta_aprendizaje = $aula->id_version_curso
                    ? RutaAprendizaje::where('id_version_curso', $aula->id_version_curso)
                        ->where('estado', 'published')
                        ->whereIn('audiencia', [$usuario->nivel, AudienciaAprendizaje::TODOS->value])
                        ->orderBy('id')
                        ->value('id')
                    : null;
            }
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
        $aula->update(['id_curso' => $curso->id, 'id_version_curso' => null, 'id_periodo_academico' => $periodo->id]);

        return $aula->fresh(['curso', 'periodoAcademico']);
    }

    public function crearSesion(Usuario $actor, Aula $aula, array $datos): SesionAprendizaje
    {
        $this->autorizarInstitucion($actor, (int) $aula->id_institucion);
        $datos = $this->normalizarHorarioSesion($datos);

        return SesionAprendizaje::create([
            ...$datos,
            'uuid' => (string) Str::uuid(),
            'id_aula' => $aula->id,
            'id_creador' => $actor->id,
            'tipo' => $datos['tipo'] ?? 'live',
            'estado' => $datos['estado'] ?? 'scheduled',
        ])->load(['aula.curso', 'aula.periodoAcademico']);
    }

    public function actualizarSesion(
        Usuario $actor,
        SesionAprendizaje $sesion,
        array $datos,
    ): SesionAprendizaje {
        $sesion->loadMissing('aula');
        $this->autorizarInstitucion($actor, (int) $sesion->aula->id_institucion);
        $sesion->update($this->normalizarHorarioSesion($datos));

        return $sesion->fresh(['aula.curso', 'aula.periodoAcademico']);
    }

    private function normalizarHorarioSesion(array $datos): array
    {
        $datos['inicio_at'] = CarbonImmutable::parse($datos['inicio_at'])->utc();
        $datos['fin_at'] = ! empty($datos['fin_at'])
            ? CarbonImmutable::parse($datos['fin_at'])->utc()
            : null;

        return $datos;
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
        $leccion->loadMissing('unidad');
        $matricula = MatriculaAula::query()
            ->where('id_usuario', $alumno->id)
            ->where('rol', 'student')
            ->where('estado', 'active')
            ->whereHas('aula', function ($query) use ($leccion): void {
                $query->where('id_curso', $leccion->unidad->id_curso);
                if ($leccion->unidad->id_version_curso) {
                    $query->where('id_version_curso', $leccion->unidad->id_version_curso);
                }
            })
            ->orderByDesc('es_principal')
            ->first();
        $aulaIds = $this->aulasDelUsuario($alumno);
        $legadoPermitido = ! $matricula && Leccion::query()
            ->whereKey($leccion->id)
            ->where('estado', 'published')
            ->whereHas('unidad.curso.aulas', fn ($query) => $query->whereIn('aulas.id', $aulaIds))
            ->exists();
        abort_unless($matricula || $legadoPermitido, 403, 'La lección no pertenece a una matrícula activa.');

        if ($datos['estado'] === 'completed') {
            $datos['porcentaje'] = 100;
            $datos['completado_at'] = now();
        }
        if ($datos['estado'] === 'inProgress') {
            $datos['iniciado_at'] = now();
        }

        $clave = $matricula
            ? ['id_matricula' => $matricula->id, 'id_leccion' => $leccion->id]
            : ['id_matricula' => null, 'id_leccion' => $leccion->id, 'id_alumno' => $alumno->id];
        $progreso = ProgresoLeccion::updateOrCreate($clave, [...$datos, 'id_alumno' => $alumno->id]);
        if (($progreso->wasRecentlyCreated || $progreso->wasChanged('estado')) && $progreso->estado === 'completed') {
            $this->outbox->registrarIdempotente(
                'learning:lesson:'.$leccion->id.':enrollment:'.($matricula?->id ?? 'legacy-'.$alumno->id).':completed',
                'learning.lesson.completed',
                'leccion',
                $leccion->id,
                ['studentId' => $alumno->id, 'enrollmentId' => $matricula?->id, 'lessonId' => $leccion->id],
                $alumno->id,
                $matricula?->id,
                $matricula?->id_version_curso,
            );
            $this->outbox->registrarIdempotente(
                'legacy:academico:lesson:'.$leccion->id.':student:'.$alumno->id.':completed',
                'academico.leccion_completada',
                'leccion',
                $leccion->id,
                ['id_alumno' => $alumno->id, 'id_institucion' => $alumno->id_institucion],
                $alumno->id,
                $matricula?->id,
                $matricula?->id_version_curso,
            );
            if ($matricula) {
                $this->progresion->completarLeccion($alumno, $leccion->id, $matricula);
            }
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

    private function autorizarInstitucion(Usuario $actor, int $institucionId): void
    {
        if ($actor->rol === 'admin') {
            return;
        }

        abort_unless((int) $actor->id_institucion === $institucionId, 403, 'No puedes administrar otra institución.');
    }
}
