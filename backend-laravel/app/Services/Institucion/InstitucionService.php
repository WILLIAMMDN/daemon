<?php

namespace App\Services\Institucion;

use App\Models\Institucion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InstitucionService
{
    /**
     * Lista instituciones con paginacion, busqueda y conteos agregados.
     *
     * @return array{data: \Illuminate\Support\Collection<int, object>, total: int, page: int, per_page: int, last_page: int, filtros: array<string, mixed>}
     */
    public function listar(Request $request): array
    {
        $perPage = max(1, min(100, (int) $request->query('per_page', 20)));
        $page = max(1, (int) $request->query('page', 1));

        $query = DB::table('instituciones as i')
            ->leftJoin('aulas as a', 'a.id_institucion', '=', 'i.id')
            ->leftJoin('usuarios as u', 'u.id_institucion', '=', 'i.id')
            ->select(
                'i.id',
                'i.nombre',
                'i.slug',
                DB::raw('count(distinct a.id) as aulas_count'),
                DB::raw('count(distinct u.id) as usuarios_count')
            )
            ->groupBy('i.id', 'i.nombre', 'i.slug');

        if ($busqueda = trim((string) $request->query('q', ''))) {
            $busquedaLower = mb_strtolower($busqueda);
            $query->where(function ($sub) use ($busquedaLower) {
                $sub->whereRaw('LOWER(i.nombre) LIKE ?', ["%{$busquedaLower}%"])
                    ->orWhereRaw('LOWER(i.slug) LIKE ?', ["%{$busquedaLower}%"]);
            });
        }

        $total = (clone $query)->get()->count();

        $data = $query
            ->orderBy('i.nombre')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get();

        return [
            'data' => $data,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'last_page' => max(1, (int) ceil($total / $perPage)),
            'filtros' => [
                'q' => $request->query('q'),
                'per_page' => $perPage,
            ],
        ];
    }

    public function detalle(Institucion $institucion): array
    {
        $aulas = DB::table('aulas')
            ->where('id_institucion', $institucion->id)
            ->select('id', 'nombre', 'nivel', 'codigo')
            ->orderBy('nombre')
            ->get();

        $usuariosPorRol = DB::table('usuarios')
            ->where('id_institucion', $institucion->id)
            ->select('rol', DB::raw('count(*) as total'))
            ->groupBy('rol')
            ->pluck('total', 'rol')
            ->toArray();

        return [
            'institucion' => $institucion,
            'aulas' => $aulas,
            'totales' => [
                'aulas' => $aulas->count(),
                'alumnos' => (int) ($usuariosPorRol['alumno'] ?? 0),
                'docentes' => (int) ($usuariosPorRol['docente'] ?? 0),
                'admins' => (int) ($usuariosPorRol['admin'] ?? 0),
                'usuarios' => array_sum($usuariosPorRol),
            ],
        ];
    }

    public function crear(array $datos): Institucion
    {
        return Institucion::create($datos);
    }

    public function actualizar(Institucion $institucion, array $datos): Institucion
    {
        $institucion->fill($datos)->save();

        return $institucion->fresh();
    }

    public function eliminar(Institucion $institucion): void
    {
        DB::transaction(function () use ($institucion) {
            $aulasAsignadas = DB::table('aulas')->where('id_institucion', $institucion->id)->count();
            abort_if(
                $aulasAsignadas > 0,
                422,
                "No se puede eliminar la institucion porque tiene {$aulasAsignadas} aula(s) asociada(s)."
            );

            $usuariosAsignados = DB::table('usuarios')->where('id_institucion', $institucion->id)->count();
            abort_if(
                $usuariosAsignados > 0,
                422,
                "No se puede eliminar la institucion porque tiene {$usuariosAsignados} usuario(s) asociado(s)."
            );

            $institucion->delete();
        });
    }
}