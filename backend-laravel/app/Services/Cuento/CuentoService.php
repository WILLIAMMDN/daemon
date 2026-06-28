<?php

namespace App\Services\Cuento;

use App\Models\Cuento;
use App\Models\Usuario;
use App\Services\Archivo\ArchivoUrlService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CuentoService
{
    public function __construct(private readonly ArchivoUrlService $archivos) {}

    public function galeria(): Collection
    {
        return DB::table('cuentos as c')
            ->join('usuarios as u', 'u.id', '=', 'c.id_alumno')
            ->select('c.*', 'u.nombre_completo as autor', 'u.avatar')
            ->orderByDesc('c.fecha_creacion')
            ->get()
            ->map(fn ($cuento) => $this->cuentoConUrls($cuento));
    }

    public function detalle(Cuento $cuento): array
    {
        $autor = DB::table('usuarios')->where('id', $cuento->id_alumno)->first();
        if ($autor) {
            $autor->avatar = $this->archivos->url($autor->avatar);
        }

        return [
            'cuento' => $this->cuentoConUrls((object) $cuento->toArray()),
            'autor' => $autor,
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

    private function cuentoConUrls(object $cuento): object
    {
        $cuento->avatar = $this->archivos->url($cuento->avatar ?? null);

        foreach (range(1, 6) as $indice) {
            $campo = 'img_'.$indice;
            if (property_exists($cuento, $campo)) {
                $cuento->{$campo} = $this->archivos->url($cuento->{$campo});
            }
        }

        return $cuento;
    }
}
