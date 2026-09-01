<?php

namespace App\Services\Academico;

use App\Models\Aula;
use App\Models\Curso;
use App\Models\ExperienciaAprendizaje;
use App\Models\HitoAprendizaje;
use App\Models\RutaAprendizaje;
use App\Models\UnidadCurso;
use App\Models\Usuario;
use App\Models\VersionCurso;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LearningCoreAuthoringService
{
    public function crearVersion(Usuario $actor, Curso $curso, array $datos): VersionCurso
    {
        $this->autorizarInstitucion($actor, (int) $curso->id_institucion);

        return DB::transaction(function () use ($curso, $datos): VersionCurso {
            $numero = (int) VersionCurso::where('id_curso', $curso->id)->lockForUpdate()->max('numero') + 1;

            return VersionCurso::create([
                ...$datos,
                'uuid' => (string) Str::uuid(),
                'id_curso' => $curso->id,
                'numero' => $numero,
                'estado' => 'draft',
            ]);
        });
    }

    public function actualizarVersion(Usuario $actor, VersionCurso $version, array $datos): VersionCurso
    {
        $version->loadMissing('curso');
        $this->autorizarInstitucion($actor, (int) $version->curso->id_institucion);
        $this->exigirBorrador($version->estado, 'versión de curso');
        $version->update($datos);

        return $version->fresh();
    }

    public function crearUnidad(Usuario $actor, VersionCurso $version, array $datos): UnidadCurso
    {
        $version->loadMissing('curso');
        $this->autorizarInstitucion($actor, (int) $version->curso->id_institucion);
        $this->exigirBorrador($version->estado, 'versión de curso');

        return UnidadCurso::create([
            ...$datos,
            'uuid' => (string) Str::uuid(),
            'id_curso' => $version->id_curso,
            'id_version_curso' => $version->id,
            'estado' => 'draft',
        ]);
    }

    public function publicarVersion(Usuario $actor, VersionCurso $version): VersionCurso
    {
        $version->loadMissing(['curso', 'unidades.lecciones']);
        $this->autorizarInstitucion($actor, (int) $version->curso->id_institucion);
        $this->exigirBorrador($version->estado, 'versión de curso');
        abort_if($version->unidades->isEmpty(), 422, 'La versión necesita al menos una unidad.');
        abort_if($version->unidades->flatMap->lecciones->isEmpty(), 422, 'La versión necesita al menos una lección.');

        return DB::transaction(function () use ($version): VersionCurso {
            UnidadCurso::where('id_version_curso', $version->id)->update(['estado' => 'published']);
            DB::table('lecciones')->whereIn('id_unidad', $version->unidades->pluck('id'))->update(['estado' => 'published']);
            $version->forceFill(['estado' => 'published', 'publicado_at' => now()])->save();

            return $version->fresh(['unidades.lecciones']);
        });
    }

    public function vincularVersionAula(Usuario $actor, Aula $aula, VersionCurso $version): Aula
    {
        $this->autorizarInstitucion($actor, (int) $aula->id_institucion);
        $version->loadMissing('curso');
        abort_unless($version->estado === 'published', 422, 'El aula solo puede usar una versión publicada.');
        abort_unless((int) $version->curso->id_institucion === (int) $aula->id_institucion, 422, 'La versión pertenece a otra institución.');
        abort_if($aula->id_curso && (int) $aula->id_curso !== (int) $version->id_curso, 422, 'La versión no corresponde al curso del aula.');
        $aula->update(['id_curso' => $version->id_curso, 'id_version_curso' => $version->id]);

        return $aula->fresh(['curso', 'versionCurso']);
    }

    public function archivarVersion(Usuario $actor, VersionCurso $version): VersionCurso
    {
        $version->loadMissing('curso');
        $this->autorizarInstitucion($actor, (int) $version->curso->id_institucion);
        abort_unless($version->estado === 'published', 409, 'Solo se puede archivar una versión publicada.');
        $version->update(['estado' => 'archived', 'archivado_at' => now()]);

        return $version->fresh();
    }

    public function crearRuta(Usuario $actor, VersionCurso $version, array $datos): RutaAprendizaje
    {
        $version->loadMissing('curso');
        $this->autorizarInstitucion($actor, (int) $version->curso->id_institucion);

        return RutaAprendizaje::create([
            ...$datos,
            'uuid' => (string) Str::uuid(),
            'id_institucion' => $version->curso->id_institucion,
            'id_curso' => $version->id_curso,
            'id_version_curso' => $version->id,
            'estado' => 'draft',
        ]);
    }

    public function actualizarRuta(Usuario $actor, RutaAprendizaje $ruta, array $datos): RutaAprendizaje
    {
        $this->autorizarRuta($actor, $ruta);
        $this->exigirBorrador($ruta->estado, 'ruta');
        $ruta->update($datos);

        return $ruta->fresh();
    }

    public function crearHito(Usuario $actor, RutaAprendizaje $ruta, array $datos): HitoAprendizaje
    {
        $this->autorizarRuta($actor, $ruta);
        $this->exigirBorrador($ruta->estado, 'ruta');

        return HitoAprendizaje::create([...$datos, 'uuid' => (string) Str::uuid(), 'id_ruta' => $ruta->id]);
    }

    public function configurarPrerrequisitos(Usuario $actor, HitoAprendizaje $hito, array $prerrequisitoIds): HitoAprendizaje
    {
        $hito->loadMissing('ruta');
        $this->autorizarRuta($actor, $hito->ruta);
        $this->exigirBorrador($hito->ruta->estado, 'ruta');
        $ids = collect($prerrequisitoIds)->map(fn ($id) => (int) $id)->unique()->values();
        abort_if($ids->contains((int) $hito->id), 422, 'Un hito no puede depender de sí mismo.');
        $validos = HitoAprendizaje::where('id_ruta', $hito->id_ruta)->whereIn('id', $ids)->count();
        abort_unless($validos === $ids->count(), 422, 'Todos los prerrequisitos deben pertenecer a la misma ruta.');

        return DB::transaction(function () use ($hito, $ids): HitoAprendizaje {
            $hito->prerrequisitos()->sync($ids);
            $this->validarSinCiclos((int) $hito->id_ruta);

            return $hito->fresh('prerrequisitos');
        });
    }

    public function crearExperiencia(Usuario $actor, HitoAprendizaje $hito, array $datos): ExperienciaAprendizaje
    {
        $hito->loadMissing('ruta.versionCurso');
        $this->autorizarRuta($actor, $hito->ruta);
        $this->exigirBorrador($hito->ruta->estado, 'ruta');
        if (! empty($datos['id_unidad'])) {
            $unidadValida = UnidadCurso::whereKey($datos['id_unidad'])
                ->where('id_version_curso', $hito->ruta->id_version_curso)
                ->exists();
            abort_unless($unidadValida, 422, 'La unidad no pertenece a la versión curricular de la ruta.');
        }
        $objetivos = $datos['objetivos'] ?? [];
        $objetivosValidos = DB::table('objetivos_aprendizaje')
            ->where('id_institucion', $hito->ruta->id_institucion)
            ->whereIn('id', $objetivos)
            ->count();
        abort_unless($objetivosValidos === count(array_unique($objetivos)), 422, 'Los objetivos deben pertenecer a la institución de la ruta.');
        $this->validarOrigenExperiencia($datos, $hito->ruta);
        unset($datos['objetivos']);

        return DB::transaction(function () use ($hito, $datos, $objetivos): ExperienciaAprendizaje {
            $experiencia = ExperienciaAprendizaje::create([
                ...$datos,
                'uuid' => (string) Str::uuid(),
                'id_hito' => $hito->id,
                'estado' => 'draft',
            ]);
            $experiencia->objetivos()->sync($objetivos);

            return $experiencia->fresh('objetivos');
        });
    }

    public function publicarRuta(Usuario $actor, RutaAprendizaje $ruta): RutaAprendizaje
    {
        $ruta->loadMissing(['versionCurso', 'hitos.experiencias']);
        $this->autorizarRuta($actor, $ruta);
        $this->exigirBorrador($ruta->estado, 'ruta');
        abort_unless($ruta->versionCurso?->estado === 'published', 422, 'La ruta requiere una versión de curso publicada.');
        abort_if($ruta->hitos->isEmpty(), 422, 'La ruta necesita al menos un hito.');
        abort_if(
            $ruta->hitos->where('obligatorio', true)->contains(fn (HitoAprendizaje $hito) => $hito->experiencias->where('obligatoria', true)->isEmpty()),
            422,
            'Cada hito obligatorio necesita al menos una experiencia obligatoria.',
        );
        $ruta->hitos->flatMap->experiencias->each(fn (ExperienciaAprendizaje $experiencia) => $this->validarOrigenExperiencia($experiencia->toArray(), $ruta));
        $this->validarSinCiclos((int) $ruta->id);

        return DB::transaction(function () use ($ruta): RutaAprendizaje {
            ExperienciaAprendizaje::whereIn('id_hito', $ruta->hitos->pluck('id'))->update(['estado' => 'published']);
            $ruta->forceFill(['estado' => 'published', 'publicado_at' => now()])->save();

            return $ruta->fresh(['versionCurso', 'hitos.prerrequisitos', 'hitos.experiencias.objetivos']);
        });
    }

    public function archivarRuta(Usuario $actor, RutaAprendizaje $ruta): RutaAprendizaje
    {
        $this->autorizarRuta($actor, $ruta);
        abort_unless($ruta->estado === 'published', 409, 'Solo se puede archivar una ruta publicada.');
        $ruta->update(['estado' => 'archived']);

        return $ruta->fresh();
    }

    public function validarSinCiclos(int $rutaId): void
    {
        $hitoIds = HitoAprendizaje::where('id_ruta', $rutaId)->pluck('id')->map(fn ($id) => (int) $id);
        $grafo = $hitoIds->mapWithKeys(fn (int $id) => [$id => []])->all();
        DB::table('hito_prerrequisitos')
            ->whereIn('id_hito', $hitoIds)
            ->get()
            ->each(function ($enlace) use (&$grafo): void {
                $grafo[(int) $enlace->id_hito][] = (int) $enlace->id_prerrequisito;
            });
        $estado = [];
        $visitar = function (int $id) use (&$visitar, &$estado, $grafo): void {
            if (($estado[$id] ?? 0) === 1) {
                throw ValidationException::withMessages(['prerrequisitos' => 'Los prerrequisitos forman un ciclo.']);
            }
            if (($estado[$id] ?? 0) === 2) {
                return;
            }
            $estado[$id] = 1;
            foreach ($grafo[$id] ?? [] as $dependencia) {
                $visitar($dependencia);
            }
            $estado[$id] = 2;
        };
        foreach ($hitoIds as $id) {
            $visitar($id);
        }
    }

    private function autorizarRuta(Usuario $actor, RutaAprendizaje $ruta): void
    {
        $this->autorizarInstitucion($actor, (int) $ruta->id_institucion);
    }

    private function autorizarInstitucion(Usuario $actor, int $institucionId): void
    {
        if ($actor->rol !== 'admin') {
            abort_unless((int) $actor->id_institucion === $institucionId, 403, 'No puedes administrar otra institución.');
        }
    }

    private function exigirBorrador(string $estado, string $entidad): void
    {
        abort_unless($estado === 'draft', 409, "Solo se puede modificar una {$entidad} en borrador.");
    }

    private function validarOrigenExperiencia(array $datos, RutaAprendizaje $ruta): void
    {
        if (empty($datos['origen_tipo']) || empty($datos['origen_id'])) {
            return;
        }
        $existe = match ($datos['origen_tipo']) {
            'leccion' => DB::table('lecciones')
                ->join('unidades_curso', 'unidades_curso.id', '=', 'lecciones.id_unidad')
                ->where('lecciones.id', $datos['origen_id'])
                ->where('unidades_curso.id_version_curso', $ruta->id_version_curso)
                ->exists(),
            'mision' => DB::table('desafios')->where('id', $datos['origen_id'])->exists(),
            'evaluacion' => DB::table('examenes')->where('id', $datos['origen_id'])->exists(),
            default => true,
        };
        abort_unless($existe, 422, 'La entidad de origen no existe o no pertenece a la versión curricular.');
    }
}
