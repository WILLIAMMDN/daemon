<?php

namespace App\Services\Archivo;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ArchivoAdminService
{
    private const BASES_RASTREABLES = [
        'uploads/perfiles',
        'uploads/bots',
        'uploads/cuentos',
        'uploads/entregas',
        'uploads/general',
        'uploads/insignias',
        'img/premios',
        'img/insignias',
    ];

    public function __construct(private readonly ArchivoUrlService $urls) {}

    /**
     * Lista archivos del disco public con paginacion, filtro por prefijo y
     * busqueda por nombre. Devuelve metadatos basicos (ruta, tamano, fecha).
     *
     * @return array{data: array<int, object>, total: int, page: int, per_page: int, last_page: int, filtros: array<string, mixed>, disk: string}
     */
    public function listar(Request $request): array
    {
        $disk = $this->disk();
        $perPage = max(1, min(100, (int) $request->query('per_page', 30)));
        $page = max(1, (int) $request->query('page', 1));

        $prefijo = trim((string) $request->query('prefijo', ''), '/');
        $busqueda = trim((string) $request->query('q', ''));

        $todos = $this->recolectar($disk, $prefijo);

        if ($busqueda !== '') {
            $busquedaLower = mb_strtolower($busqueda);
            $todos = array_values(array_filter($todos, fn ($archivo) => str_contains(mb_strtolower($archivo->ruta), $busquedaLower)));
        }

        usort($todos, fn ($a, $b) => strcmp($b->ruta, $a->ruta));

        $total = count($todos);
        $offset = ($page - 1) * $perPage;
        $slice = array_slice($todos, $offset, $perPage);

        return [
            'data' => $slice,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'last_page' => max(1, (int) ceil($total / $perPage)),
            'filtros' => [
                'q' => $busqueda ?: null,
                'prefijo' => $prefijo ?: null,
                'per_page' => $perPage,
            ],
            'disk' => $disk,
        ];
    }

    /**
     * Elimina un archivo del disco. Devuelve true si existia, false si no.
     */
    public function eliminar(string $ruta): bool
    {
        $ruta = ltrim($ruta, '/');
        $disk = $this->disk();

        if (! Storage::disk($disk)->exists($ruta)) {
            return false;
        }

        return Storage::disk($disk)->delete($ruta);
    }

    /**
     * Elimina multiples archivos en bulk. Devuelve la cantidad eliminada.
     *
     * @param  array<int, string>  $rutas
     */
    public function eliminarBulk(array $rutas): int
    {
        $eliminados = 0;
        foreach ($rutas as $ruta) {
            if ($this->eliminar((string) $ruta)) {
                $eliminados++;
            }
        }

        return $eliminados;
    }

    /**
     * Resuelve los prefijos disponibles para filtrar.
     *
     * @return array<int, string>
     */
    public function prefijosDisponibles(): array
    {
        $disk = $this->disk();
        $encontrados = [];

        foreach (self::BASES_RASTREABLES as $base) {
            if (Storage::disk($disk)->exists($base)) {
                $encontrados[] = $base;
            }
        }

        return $encontrados;
    }

    /**
     * Recolecta recursivamente todos los archivos bajo un prefijo (o todos
     * los prefijos rastreables si no se pasa prefijo).
     *
     * @return array<int, object>
     */
    private function recolectar(string $disk, string $prefijo): array
    {
        $raices = $prefijo !== '' ? [$prefijo] : self::BASES_RASTREABLES;
        $archivos = [];

        foreach ($raices as $raiz) {
            if (! Storage::disk($disk)->exists($raiz)) {
                continue;
            }
            $archivos = array_merge($archivos, $this->caminar($disk, $raiz));
        }

        return $archivos;
    }

    /**
     * @return array<int, object>
     */
    private function caminar(string $disk, string $directorio): array
    {
        $archivos = [];

        foreach (Storage::disk($disk)->files($directorio) as $ruta) {
            try {
                $tamano = Storage::disk($disk)->size($ruta);
                $fecha = Storage::disk($disk)->lastModified($ruta);
            } catch (\Throwable $e) {
                continue;
            }

            $archivos[] = (object) [
                'ruta' => $ruta,
                'url' => $this->urls->url($ruta),
                'tamano' => $tamano,
                'tamano_legible' => $this->tamanoLegible((int) $tamano),
                'modificado_en' => $fecha ? date('c', $fecha) : null,
                'extension' => strtolower(pathinfo($ruta, PATHINFO_EXTENSION)),
                'directorio' => trim(dirname($ruta), '.'),
            ];
        }

        foreach (Storage::disk($disk)->directories($directorio) as $subdir) {
            $archivos = array_merge($archivos, $this->caminar($disk, $subdir));
        }

        return $archivos;
    }

    private function disk(): string
    {
        return env('UPLOADS_DISK', 'public') ?: 'public';
    }

    private function tamanoLegible(int $bytes): string
    {
        if ($bytes < 1024) {
            return "{$bytes} B";
        }
        if ($bytes < 1024 * 1024) {
            return round($bytes / 1024, 1).' KB';
        }

        return round($bytes / 1024 / 1024, 2).' MB';
    }
}