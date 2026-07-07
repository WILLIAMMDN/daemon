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

    public function adminListar(): Collection
    {
        return DB::table('cuentos as c')
            ->leftJoin('usuarios as u', 'u.id', '=', 'c.id_alumno')
            ->select('c.*', 'u.nombre_completo as autor', 'u.avatar', 'u.id_aula')
            ->orderByDesc('c.fecha_creacion')
            ->get()
            ->map(fn ($cuento) => $this->cuentoConUrls($cuento));
    }

    public function adminActualizar(Cuento $cuento, array $datos): Cuento
    {
        $cuento->fill($datos)->save();

        return $cuento->fresh();
    }

    public function adminEliminar(Cuento $cuento): void
    {
        $cuento->delete();
    }

public function adminPublicar(Cuento $cuento, bool $publicado): Cuento
    {
        $cuento->publicado = $publicado;
        $cuento->save();

        return $cuento;
    }

    /**
     * Elimina el cuento del alumno autenticado. Solo el dueno puede borrar
     * su propio cuento. Devuelve true si existia y se elimino.
     */
    public function eliminarPropio(Usuario $alumno): bool
    {
        $cuento = Cuento::where('id_alumno', $alumno->id)->first();
        if (! $cuento) {
            return false;
        }

        $cuento->delete();

        return true;
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
