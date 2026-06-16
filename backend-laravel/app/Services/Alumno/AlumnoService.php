<?php

namespace App\Services\Alumno;

use App\Models\Usuario;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AlumnoService
{
    public function panel(Usuario $usuario): array
    {
        $posicion = Usuario::where('nivel', $usuario->nivel)
            ->where('rol', 'alumno')
            ->where('tokens', '>', $usuario->tokens)
            ->count() + 1;

        return [
            'usuario' => $usuario,
            'posicion' => $posicion,
            'misiones_pendientes' => DB::table('desafios')->where('estado', 'activo')->count(),
            'insignias' => DB::table('insignias_otorgadas')->where('id_alumno', $usuario->id)->count(),
            'canjes_pendientes' => DB::table('canjes')->where('id_alumno', $usuario->id)->where('estado', 'pendiente')->count(),
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
                ->get(),
            'mochila' => DB::table('canjes as c')
                ->join('premios as p', 'p.id', '=', 'c.id_premio')
                ->where('c.id_alumno', $usuario->id)
                ->where('c.estado', 'entregado')
                ->select('p.*', 'c.fecha')
                ->get(),
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
            ->orderByDesc('tokens')
            ->get();
    }
}
