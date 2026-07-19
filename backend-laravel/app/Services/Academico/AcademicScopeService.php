<?php

namespace App\Services\Academico;

use App\Models\Aula;
use App\Models\MatriculaAula;
use App\Models\Usuario;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Facades\Schema;

class AcademicScopeService
{
    public function aplicarAlumnosEloquent(EloquentBuilder $query, ?Usuario $usuario, string $columna = 'id_aula'): EloquentBuilder
    {
        if ($usuario?->rol !== 'docente') {
            return $query;
        }

        $aulas = $this->aulasGestionables($usuario);
        if ($aulas === []) {
            return $query->whereRaw('1 = 0');
        }

        if (! Schema::hasTable('matriculas_aula')) {
            return $query->whereIn($columna, $aulas);
        }

        return $query->where(function (EloquentBuilder $scope) use ($columna, $aulas): void {
            $scope->whereIn($columna, $aulas)
                ->orWhereHas('matriculas', fn (EloquentBuilder $matriculas) => $matriculas
                    ->whereIn('id_aula', $aulas)
                    ->where('rol', 'student')
                    ->where('estado', 'active'));
        });
    }

    public function aplicarAlumnosQuery(QueryBuilder $query, ?Usuario $usuario, string $columna = 'id_aula'): QueryBuilder
    {
        if ($usuario?->rol !== 'docente') {
            return $query;
        }

        $aulas = $this->aulasGestionables($usuario);
        if ($aulas === []) {
            return $query->whereRaw('1 = 0');
        }

        if (! Schema::hasTable('matriculas_aula')) {
            return $query->whereIn($columna, $aulas);
        }

        $prefijo = str_contains($columna, '.') ? explode('.', $columna, 2)[0] : 'usuarios';

        return $query->where(function (QueryBuilder $scope) use ($columna, $aulas, $prefijo): void {
            $scope->whereIn($columna, $aulas)
                ->orWhereExists(fn (QueryBuilder $matriculas) => $matriculas
                    ->selectRaw('1')
                    ->from('matriculas_aula as matricula_scope')
                    ->whereColumn('matricula_scope.id_usuario', "{$prefijo}.id")
                    ->whereIn('matricula_scope.id_aula', $aulas)
                    ->where('matricula_scope.rol', 'student')
                    ->where('matricula_scope.estado', 'active'));
        });
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

        $aulas = $this->aulasGestionables($actor);
        abort_unless($actor->rol === 'docente' && $aulas !== [], 403, 'El docente no tiene un aula asignada.');

        $alumno = $query->findOrFail($idAlumno);
        $pertenece = in_array((int) $alumno->id_aula, $aulas, true)
            || (Schema::hasTable('matriculas_aula') && MatriculaAula::where('id_usuario', $alumno->id)
                ->whereIn('id_aula', $aulas)
                ->where('rol', 'student')
                ->where('estado', 'active')
                ->exists());
        abort_unless($pertenece, 403, 'Este alumno no pertenece a un aula asignada al docente.');

        return $alumno;
    }

    public function puedeGestionarAlumno(Usuario $actor, Usuario $alumno): bool
    {
        if ($actor->rol === 'admin') {
            return true;
        }

        if ($actor->rol !== 'docente') {
            return false;
        }

        $aulas = $this->aulasGestionables($actor);

        return in_array((int) $alumno->id_aula, $aulas, true)
            || (Schema::hasTable('matriculas_aula') && MatriculaAula::where('id_usuario', $alumno->id)
                ->whereIn('id_aula', $aulas)
                ->where('rol', 'student')
                ->where('estado', 'active')
                ->exists());
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

    /** @return array<int, int> */
    private function aulasGestionables(Usuario $usuario): array
    {
        if (! Schema::hasTable('matriculas_aula')) {
            return $usuario->id_aula ? [(int) $usuario->id_aula] : [];
        }

        $ids = MatriculaAula::where('id_usuario', $usuario->id)
            ->where('estado', 'active')
            ->where('rol', 'teacher')
            ->pluck('id_aula');
        if ($usuario->id_aula) {
            $ids->push($usuario->id_aula);
        }

        return $ids->map(fn ($id) => (int) $id)->unique()->values()->all();
    }
}
