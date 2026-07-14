<?php

namespace App\Services\Alumno;

use App\Models\Usuario;
use App\Services\Archivo\ArchivoUrlService;
use App\Services\Gamificacion\GamificacionService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AlumnoService
{
    public function __construct(
        private readonly ArchivoUrlService $archivos,
        private readonly GamificacionService $gamificacion,
    ) {}

    public function panel(Usuario $usuario): array
    {
        $metricas = DB::query()
            ->selectSub(
                DB::table('usuarios')
                    ->where('nivel', $usuario->nivel)
                    ->where('rol', 'alumno')
                    ->where('experiencia', '>', $usuario->experiencia)
                    ->selectRaw('count(*) + 1'),
                'posicion',
            )
            ->selectSub(
                DB::table('insignias_otorgadas')
                    ->where('id_alumno', $usuario->id)
                    ->selectRaw('count(*)'),
                'insignias',
            )
            ->selectSub(
                DB::table('canjes')
                    ->where('id_alumno', $usuario->id)
                    ->where('estado', 'pendiente')
                    ->selectRaw('count(*)'),
                'canjes_pendientes',
            )
            ->first();

        $misionesDisponibles = DB::table('desafios as d')
            ->where('d.estado', 'activo')
            ->whereIn('d.nivel_requerido', ['TODOS', $usuario->nivel])
            ->whereNotExists(function ($query) use ($usuario): void {
                $query->selectRaw('1')
                    ->from('entregas as e')
                    ->whereColumn('e.id_desafio', 'd.id')
                    ->where('e.id_alumno', $usuario->id)
                    ->whereIn('e.estado', ['pendiente', 'aprobado']);
            });

        $proximaMision = (clone $misionesDisponibles)
            ->orderByDesc('d.es_mision_nivel')
            ->orderBy('d.id')
            ->select('d.id', 'd.titulo', 'd.descripcion', 'd.recompensa', 'd.tipo_evidencia', 'd.nivel_requerido')
            ->first();

        $misionesCompletadas = DB::table('entregas')
            ->where('id_alumno', $usuario->id)
            ->where('estado', 'aprobado')
            ->distinct()
            ->count('id_desafio');

        return [
            'usuario' => $usuario,
            'posicion' => (int) ($metricas->posicion ?? 1),
            'misiones_pendientes' => (clone $misionesDisponibles)->count(),
            'misiones_completadas' => $misionesCompletadas,
            'insignias' => (int) ($metricas->insignias ?? 0),
            'canjes_pendientes' => (int) ($metricas->canjes_pendientes ?? 0),
            'racha' => $this->rachaActual($usuario),
            'proxima_mision' => $proximaMision,
            'progreso_nivel' => $this->gamificacion->progreso((int) $usuario->experiencia),
        ];
    }

    public function perfil(Usuario $usuario): array
    {
        return [
            'usuario' => $usuario,
            'insignias' => DB::table('insignias_otorgadas as io')
                ->join('insignias as i', 'i.id', '=', 'io.id_insignia')
                ->where('io.id_alumno', $usuario->id)
                ->select('i.*', 'io.fecha')
                ->get()
                ->map(function ($insignia) {
                    $insignia->imagen = $this->archivos->url($insignia->imagen);

                    return $insignia;
                }),
            'mochila' => DB::table('canjes as c')
                ->join('premios as p', 'p.id', '=', 'c.id_premio')
                ->where('c.id_alumno', $usuario->id)
                ->where('c.estado', 'entregado')
                ->select('p.*', 'c.fecha')
                ->get()
                ->map(function ($premio) {
                    $premio->imagen = $this->archivos->url($premio->imagen);

                    return $premio;
                }),
        ];
    }

    public function actualizarPerfil(Usuario $usuario, array $datos): Usuario
    {
        $usuario->update($datos);

        return $usuario->fresh();
    }

    public function comunidad(): Collection
    {
        return Usuario::query()
            ->select('id', 'nombre_completo', 'usuario', 'nivel', 'tokens', 'experiencia', 'rango', 'avatar', 'rol')
            ->whereIn('rol', ['alumno', 'docente'])
            ->orderByDesc('experiencia')
            ->get();
    }

    private function rachaActual(Usuario $usuario): int
    {
        $dias = DB::table('entregas')
            ->where('id_alumno', $usuario->id)
            ->where('estado', 'aprobado')
            ->orderByDesc('fecha_entrega')
            ->pluck('fecha_entrega')
            ->map(fn ($fecha) => CarbonImmutable::parse($fecha)->startOfDay())
            ->unique(fn (CarbonImmutable $fecha) => $fecha->toDateString())
            ->values();

        if ($dias->isEmpty()) {
            return 0;
        }

        $hoy = CarbonImmutable::today();
        $cursor = $dias->first();

        if ($cursor->lt($hoy->subDay())) {
            return 0;
        }

        $racha = 0;
        foreach ($dias as $dia) {
            if (! $dia->isSameDay($cursor)) {
                break;
            }

            $racha++;
            $cursor = $cursor->subDay();
        }

        return $racha;
    }
}
