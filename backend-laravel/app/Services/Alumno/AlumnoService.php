<?php

namespace App\Services\Alumno;

use App\Models\Usuario;
use App\Services\Archivo\ArchivoUrlService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AlumnoService
{
    public function __construct(private readonly ArchivoUrlService $archivos) {}

    public function panel(Usuario $usuario): array
    {
        $metricas = DB::query()
            ->selectSub(
                DB::table('usuarios')
                    ->where('nivel', $usuario->nivel)
                    ->where('rol', 'alumno')
                    ->where('tokens', '>', $usuario->tokens)
                    ->selectRaw('count(*) + 1'),
                'posicion',
            )
            ->selectSub(
                DB::table('desafios')
                    ->where('estado', 'activo')
                    ->selectRaw('count(*)'),
                'misiones_pendientes',
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

        return [
            'usuario' => $usuario,
            'posicion' => (int) ($metricas->posicion ?? 1),
            'misiones_pendientes' => (int) ($metricas->misiones_pendientes ?? 0),
            'insignias' => (int) ($metricas->insignias ?? 0),
            'canjes_pendientes' => (int) ($metricas->canjes_pendientes ?? 0),
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
            ->select('id', 'nombre_completo', 'usuario', 'nivel', 'tokens', 'rango', 'avatar', 'rol')
            ->whereIn('rol', ['alumno', 'docente'])
            ->orderByDesc('tokens')
            ->get();
    }
}
