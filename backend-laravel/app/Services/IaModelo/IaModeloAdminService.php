<?php

namespace App\Services\IaModelo;

use App\Models\ModeloIa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class IaModeloAdminService
{
    /**
     * Lista modelos IA con paginacion, busqueda por nombre de proyecto y
     * filtro por alumno.
     *
     * @return array{data: \Illuminate\Support\Collection<int, object>, total: int, page: int, per_page: int, last_page: int, filtros: array<string, mixed>}
     */
    public function listar(Request $request): array
    {
        $perPage = max(1, min(100, (int) $request->query('per_page', 20)));
        $page = max(1, (int) $request->query('page', 1));

        $query = DB::table('ia_modelos as m')
            ->join('usuarios as u', 'u.id', '=', 'm.id_alumno')
            ->select(
                'm.id',
                'm.id_alumno',
                'm.nombre_proyecto',
                'm.fecha_actualizacion',
                'u.nombre_completo as alumno',
                'u.usuario as alumno_usuario',
                'u.nivel as alumno_nivel'
            );

        if ($busqueda = trim((string) $request->query('q', ''))) {
            $busquedaLower = mb_strtolower($busqueda);
            $query->where(function ($sub) use ($busquedaLower) {
                $sub->whereRaw('LOWER(m.nombre_proyecto) LIKE ?', ["%{$busquedaLower}%"])
                    ->orWhereRaw('LOWER(u.nombre_completo) LIKE ?', ["%{$busquedaLower}%"]);
            });
        }

        if ($idAlumno = $request->query('id_alumno')) {
            $query->where('m.id_alumno', (int) $idAlumno);
        }

        $total = (clone $query)->count();

        $data = $query
            ->orderByDesc('m.fecha_actualizacion')
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
                'id_alumno' => $request->query('id_alumno'),
                'per_page' => $perPage,
            ],
        ];
    }

    public function detalle(ModeloIa $modelo): ModeloIa
    {
        return $modelo;
    }

    public function crear(array $datos): ModeloIa
    {
        $datos['fecha_actualizacion'] = now();

        return ModeloIa::create($datos);
    }

    public function actualizar(ModeloIa $modelo, array $datos): ModeloIa
    {
        $datos['fecha_actualizacion'] = now();
        $modelo->fill($datos)->save();

        return $modelo->fresh();
    }

    public function eliminar(ModeloIa $modelo): void
    {
        $modelo->delete();
    }

    /**
     * @param  array<int, int>  $ids
     */
    public function eliminarBulk(array $ids): int
    {
        return ModeloIa::whereIn('id', $ids)->delete();
    }

    /**
     * @return array<string, int>
     */
    public function estadisticas(): array
    {
        return [
            'total' => ModeloIa::count(),
            'alumnos_con_modelos' => (int) DB::table('ia_modelos')->distinct('id_alumno')->count('id_alumno'),
            'actualizados_hoy' => ModeloIa::whereDate('fecha_actualizacion', today())->count(),
            'actualizados_ultimos_7' => ModeloIa::where('fecha_actualizacion', '>=', now()->subDays(7))->count(),
        ];
    }
}