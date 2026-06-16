<?php

namespace App\Services\Cuento;

use App\Models\Cuento;
use App\Models\Usuario;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CuentoService
{
    public function galeria(): Collection
    {
        return DB::table('cuentos as c')
            ->join('usuarios as u', 'u.id', '=', 'c.id_alumno')
            ->select('c.*', 'u.nombre_completo as autor', 'u.avatar')
            ->orderByDesc('c.fecha_creacion')
            ->get();
    }

    public function detalle(Cuento $cuento): array
    {
        return [
            'cuento' => $cuento,
            'autor' => DB::table('usuarios')->where('id', $cuento->id_alumno)->first(),
        ];
    }

    public function mio(Usuario $usuario): ?Cuento
    {
        return Cuento::where('id_alumno', $usuario->id)->first();
    }

    public function guardar(Usuario $usuario, array $datos): Cuento
    {
        return Cuento::updateOrCreate(['id_alumno' => $usuario->id], $datos);
    }
}
