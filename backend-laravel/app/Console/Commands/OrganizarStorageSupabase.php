<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class OrganizarStorageSupabase extends Command
{
    protected $signature = 'daemon:organizar-storage-supabase {--disk=supabase : Disco cloud destino} {--confirm : Ejecutar subidas, actualizar rutas en BD y limpiar objetos no referenciados}';

    protected $description = 'Ordena archivos referenciados por la base en carpetas de negocio y retira del bucket assets que pertenecen al hosting frontend.';

    /** @var array<int, array{tabla: string, id: int, campo: string, origen: string, destino: string, source: string|null}> */
    private array $movimientos = [];

    /** @var array<int, string> */
    private array $faltantes = [];

    /** @var array<int, string> */
    private array $extensionesPermitidas = [
        'avif', 'csv', 'doc', 'docx', 'gif', 'jfif', 'jpeg', 'jpg', 'mp3', 'mp4', 'pdf',
        'png', 'ppt', 'pptx', 'svg', 'txt', 'wav', 'webm', 'webp', 'xls', 'xlsx', 'zip',
    ];

    public function handle(): int
    {
        $disk = (string) $this->option('disk');
        $this->prepararMovimientos();
        $pendientes = collect($this->movimientos)
            ->filter(fn (array $movimiento): bool => $movimiento['origen'] !== $movimiento['destino'])
            ->count();

        $this->table(['tipo', 'cantidad'], [
            ['rutas de negocio referenciadas', count($this->movimientos)],
            ['pendientes por organizar', $pendientes],
            ['origen local faltante', count($this->faltantes)],
        ]);

        if ($this->faltantes !== []) {
            $this->warn('Archivos referenciados pero no encontrados localmente:');
            foreach (array_slice($this->faltantes, 0, 20) as $faltante) {
                $this->line('- '.$faltante);
            }
        }

        if (! $this->option('confirm')) {
            $this->warn('Revision lista. No se cambio nada porque falta --confirm.');

            return self::SUCCESS;
        }

        if ($this->faltantes !== []) {
            $this->error('No se ejecuta con archivos faltantes. Corrige esas rutas o archivos primero.');

            return self::FAILURE;
        }

        $targets = [];
        $subidos = 0;
        $actualizados = 0;

        foreach ($this->movimientos as $movimiento) {
            $targets[$movimiento['destino']] = true;

            if ($movimiento['origen'] !== $movimiento['destino']) {
                $stream = fopen((string) $movimiento['source'], 'rb');

                if ($stream === false) {
                    $this->error('No se pudo abrir '.$movimiento['source']);

                    return self::FAILURE;
                }

                try {
                    Storage::disk($disk)->put($movimiento['destino'], $stream);
                    $subidos++;
                } finally {
                    fclose($stream);
                }

                DB::table($movimiento['tabla'])
                    ->where('id', $movimiento['id'])
                    ->update([$movimiento['campo'] => $movimiento['destino']]);

                $actualizados++;
            }
        }

        $eliminados = $this->limpiarBucket($disk, array_keys($targets));

        $this->info("Storage organizado. Subidos: {$subidos}. Rutas BD actualizadas: {$actualizados}. Objetos no referenciados eliminados del bucket: {$eliminados}.");

        return self::SUCCESS;
    }

    private function prepararMovimientos(): void
    {
        $this->usuarios();
        $this->bots();
        $this->premios();
        $this->insignias();
        $this->entregas();
        $this->cuentos();
    }

    private function usuarios(): void
    {
        foreach (DB::table('usuarios')->select('id', 'avatar', 'fondo', 'heroe')->get() as $usuario) {
            $this->registrar('usuarios', $usuario->id, 'avatar', $usuario->avatar, "uploads/perfiles/{$usuario->id}/avatar");
            $this->registrar('usuarios', $usuario->id, 'fondo', $usuario->fondo, "uploads/perfiles/{$usuario->id}/fondos");
            $this->registrar('usuarios', $usuario->id, 'heroe', $usuario->heroe, "uploads/perfiles/{$usuario->id}/heroes");
        }
    }

    private function bots(): void
    {
        foreach (DB::table('bots_alumnos')->select('id', 'id_alumno', 'avatar')->get() as $bot) {
            if (in_array($bot->avatar, ['img/bot_default.png', 'img/bot_default.svg'], true)) {
                continue;
            }

            $this->registrar('bots_alumnos', $bot->id, 'avatar', $bot->avatar, "uploads/bots/{$bot->id_alumno}/avatar");
        }
    }

    private function premios(): void
    {
        foreach (DB::table('premios')->select('id', 'imagen')->get() as $premio) {
            $this->registrar('premios', $premio->id, 'imagen', $premio->imagen, "uploads/tienda/premios/{$premio->id}");
        }
    }

    private function insignias(): void
    {
        foreach (DB::table('insignias')->select('id', 'imagen')->get() as $insignia) {
            $this->registrar('insignias', $insignia->id, 'imagen', $insignia->imagen, "uploads/insignias/{$insignia->id}");
        }
    }

    private function entregas(): void
    {
        foreach (DB::table('entregas')->select('id', 'id_alumno', 'archivo_url')->get() as $entrega) {
            $this->registrar('entregas', $entrega->id, 'archivo_url', $entrega->archivo_url, "uploads/entregas/{$entrega->id_alumno}");
        }
    }

    private function cuentos(): void
    {
        foreach (DB::table('cuentos')->select('id', 'id_alumno', 'img_1', 'img_2', 'img_3', 'img_4', 'img_5', 'img_6')->get() as $cuento) {
            foreach (['img_1', 'img_2', 'img_3', 'img_4', 'img_5', 'img_6'] as $campo) {
                $this->registrar('cuentos', $cuento->id, $campo, $cuento->{$campo}, "uploads/cuentos/{$cuento->id_alumno}");
            }
        }
    }

    private function registrar(string $tabla, int $id, string $campo, ?string $origen, string $directorioDestino): void
    {
        $origen = trim((string) $origen);

        if ($origen === '' || preg_match('/^(https?:|data:|blob:)/i', $origen) || ! $this->esArchivoPermitido($origen)) {
            return;
        }

        $origen = ltrim($origen, '/');
        $destino = trim($directorioDestino, '/').'/'.basename($origen);

        if ($origen === $destino) {
            $this->movimientos[] = compact('tabla', 'id', 'campo', 'origen', 'destino') + ['source' => null];

            return;
        }

        $source = $this->origenLocal($origen);

        if ($source === null) {
            $this->faltantes[] = "{$tabla}.{$campo}#{$id}: {$origen}";

            return;
        }

        $this->movimientos[] = compact('tabla', 'id', 'campo', 'origen', 'destino', 'source');
    }

    private function esArchivoPermitido(string $ruta): bool
    {
        $extension = strtolower(pathinfo(parse_url($ruta, PHP_URL_PATH) ?: $ruta, PATHINFO_EXTENSION));

        return in_array($extension, $this->extensionesPermitidas, true);
    }

    private function origenLocal(string $ruta): ?string
    {
        $candidatos = [
            base_path('../frontend-angular/public/'.$ruta),
            base_path('storage/app/public/'.$ruta),
        ];

        foreach ($candidatos as $candidato) {
            if (is_file($candidato)) {
                return $candidato;
            }
        }

        return null;
    }

    /**
     * @param  array<int, string>  $targets
     */
    private function limpiarBucket(string $disk, array $targets): int
    {
        $mantener = array_fill_keys($targets, true);
        $eliminados = 0;

        foreach (Storage::disk($disk)->allFiles('') as $archivo) {
            if (isset($mantener[$archivo])) {
                continue;
            }

            Storage::disk($disk)->delete($archivo);
            $eliminados++;
        }

        return $eliminados;
    }
}
