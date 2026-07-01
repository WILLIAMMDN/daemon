<?php

namespace App\Services\Academico;

use App\Models\Aula;
use App\Models\Usuario;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder as QueryBuilder;

class AcademicScopeService
{
    public function aplicarAlumnosEloquent(EloquentBuilder $query, ?Usuario $usuario, string $columna = 'id_aula'): EloquentBuilder
    {
        if ($usuario?->rol !== 'docente') {
            return $query;
        }

        if (blank($usuario->id_aula)) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where($columna, $usuario->id_aula);
    }

    public function aplicarAlumnosQuery(QueryBuilder $query, ?Usuario $usuario, string $columna = 'id_aula'): QueryBuilder
    {
        if ($usuario?->rol !== 'docente') {
            return $query;
        }

        if (blank($usuario->id_aula)) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where($columna, $usuario->id_aula);
    }

    public function alumnoGestionable(Usuario $actor, int $idAlumno, bool $bloquear = false): Usuario
    {
        $query = Usuario::query()->where('rol', 'alumno');

        if ($bloquear) {
            $query->lockForUpdate();
        }

        if ($actor->rol === 'admin') {
            return $query->findOrFail($idAlumno);
        }

        abort_unless($actor->rol === 'docente' && filled($actor->id_aula), 403, 'El docente no tiene un aula asignada.');

        $alumno = $query->findOrFail($idAlumno);
        abort_unless((int) $alumno->id_aula === (int) $actor->id_aula, 403, 'Este alumno no pertenece al aula asignada.');

        return $alumno;
    }

    public function puedeGestionarAlumno(Usuario $actor, Usuario $alumno): bool
    {
        if ($actor->rol === 'admin') {
            return true;
        }

        return $actor->rol === 'docente'
            && filled($actor->id_aula)
            && (int) $actor->id_aula === (int) $alumno->id_aula;
    }

    public function resumen(?Usuario $usuario): array
    {
        if (! $usuario) {
            return [
                'tipo' => 'publico',
                'titulo' => 'Sin sesion',
                'descripcion' => 'No hay un usuario autenticado para calcular alcance.',
                'aula' => null,
                'institucion' => null,
            ];
        }

        if ($usuario->rol === 'admin') {
            return [
                'tipo' => 'global',
                'titulo' => 'Todas las aulas',
                'descripcion' => 'Vista administrativa con acceso a todos los alumnos y aulas.',
                'aula' => null,
                'institucion' => null,
            ];
        }

        if ($usuario->rol === 'docente' && blank($usuario->id_aula)) {
            return [
                'tipo' => 'sin_aula',
                'titulo' => 'Docente sin aula asignada',
                'descripcion' => 'Asigna un aula para activar su dashboard, alumnos, entregas y tokens.',
                'aula' => null,
                'institucion' => null,
            ];
        }

        $aula = $usuario->aula()->with('institucion')->first();

        return [
            'tipo' => $usuario->rol === 'docente' ? 'aula' : 'alumno',
            'titulo' => $aula?->nombre ?? 'Aula no encontrada',
            'descripcion' => $aula ? 'Vista limitada al aula asignada.' : 'El usuario tiene un aula pendiente de revisar.',
            'aula' => $this->aulaPayload($aula),
            'institucion' => $aula?->institucion ? [
                'id' => $aula->institucion->id,
                'nombre' => $aula->institucion->nombre,
                'slug' => $aula->institucion->slug,
            ] : null,
        ];
    }

    public function aulaPayload(?Aula $aula): ?array
    {
        if (! $aula) {
            return null;
        }

        return [
            'id' => $aula->id,
            'nombre' => $aula->nombre,
            'nivel' => $aula->nivel,
            'codigo' => $aula->codigo,
            'id_institucion' => $aula->id_institucion,
        ];
    }
}
