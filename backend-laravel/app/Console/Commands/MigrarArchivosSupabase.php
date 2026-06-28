<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use SplFileInfo;
use Throwable;

class MigrarArchivosSupabase extends Command
{
    protected $signature = 'daemon:migrar-archivos-supabase {--frontend-public=../frontend-angular/public : Carpeta public del frontend} {--backend-public=storage/app/public : Carpeta public del backend} {--disk=supabase : Disco cloud destino} {--confirm : Ejecutar la subida real; sin esto solo revisa}';

    protected $description = 'Sube assets publicos y uploads locales a Supabase Storage conservando rutas y evitando extensiones peligrosas.';

    /** @var array<int, string> */
    private array $extensionesPermitidas = [
        'apng', 'avif', 'css', 'gif', 'html', 'ico', 'jfif', 'jpeg', 'jpg', 'js', 'json',
        'm4a', 'map', 'mp3', 'mp4', 'ogg', 'pdf', 'png', 'riv', 'svg', 'ttf', 'txt',
        'wasm', 'wav', 'webm', 'webp', 'woff', 'woff2',
    ];

    /** @var array<int, string> */
    private array $archivosLocales = ['.DS_Store', '.gitignore', '.htaccess', 'Thumbs.db'];

    /** @var array<int, string> */
    private array $prefijosPermitidos = [
        'uploads/perfiles/',
        'uploads/bots/',
        'uploads/entregas/',
        'uploads/tienda/',
        'uploads/insignias/',
        'uploads/general/',
    ];

    public function handle(): int
    {
        $disk = (string) $this->option('disk');

        if ($this->option('confirm') && ! $this->storageConfigurado($disk)) {
            return self::FAILURE;
        }

        $archivos = collect([
            ...$this->escanear(base_path((string) $this->option('frontend-public')), ''),
            ...$this->escanear(base_path((string) $this->option('backend-public')), ''),
        ])->unique('target')->values();

        $permitidos = $archivos->where('estado', 'permitido')->values();
        $omitidos = $archivos->where('estado', 'omitido')->values();
        $bloqueados = $archivos->where('estado', 'bloqueado')->values();

        $this->table(['tipo', 'cantidad'], [
            ['permitidos', $permitidos->count()],
            ['omitidos locales', $omitidos->count()],
            ['bloqueados seguridad', $bloqueados->count()],
        ]);

        if ($bloqueados->isNotEmpty()) {
            $this->warn('Archivos bloqueados por seguridad:');
            $bloqueados->take(20)->each(fn (array $archivo) => $this->line('- '.$archivo['target']));

            if ($bloqueados->count() > 20) {
                $this->line('... y '.($bloqueados->count() - 20).' mas.');
            }
        }

        if (! $this->option('confirm')) {
            $this->warn('Revision lista. No se subio nada porque falta --confirm.');
            $this->line('Si el resumen esta correcto, ejecuta el mismo comando con --confirm para subir o actualizar los archivos.');

            return self::SUCCESS;
        }

        $subidos = 0;

        foreach ($permitidos as $archivo) {
            $stream = fopen($archivo['source'], 'rb');

            if ($stream === false) {
                $this->warn('No se pudo abrir: '.$archivo['source']);

                continue;
            }

            try {
                Storage::disk($disk)->put($archivo['target'], $stream);
                $subidos++;
            } finally {
                fclose($stream);
            }
        }

        $this->info("Archivos subidos a {$disk}: {$subidos}");

        return self::SUCCESS;
    }

    private function storageConfigurado(string $disk): bool
    {
        try {
            Storage::disk($disk);

            if ($disk === 'supabase' && (! env('SUPABASE_STORAGE_ACCESS_KEY_ID') || ! env('SUPABASE_STORAGE_SECRET_ACCESS_KEY'))) {
                $this->error('Faltan SUPABASE_STORAGE_ACCESS_KEY_ID y/o SUPABASE_STORAGE_SECRET_ACCESS_KEY en .env.');

                return false;
            }

            return true;
        } catch (Throwable $exception) {
            $this->error('No se pudo preparar el disco '.$disk.'.');
            $this->line($exception->getMessage());

            return false;
        }
    }

    /**
     * @return array<int, array{source: string, target: string, estado: string}>
     */
    private function escanear(string $root, string $prefix): array
    {
        if (! is_dir($root)) {
            return [];
        }

        $items = [];
        $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, RecursiveDirectoryIterator::SKIP_DOTS));

        /** @var SplFileInfo $file */
        foreach ($iterator as $file) {
            if (! $file->isFile()) {
                continue;
            }

            $relative = str_replace('\\', '/', substr($file->getPathname(), strlen($root) + 1));
            $target = trim($prefix.'/'.$relative, '/');
            $extension = strtolower($file->getExtension());
            $estado = $this->estadoArchivo($target, $extension);

            $items[] = [
                'source' => $file->getPathname(),
                'target' => $target,
                'estado' => $estado,
            ];
        }

        return $items;
    }

    private function estadoArchivo(string $target, string $extension): string
    {
        $nombre = basename($target);

        if (str_starts_with($nombre, '.') || in_array($nombre, $this->archivosLocales, true)) {
            return 'omitido';
        }

        if (! $this->tienePrefijoPermitido($target)) {
            return 'omitido';
        }

        if (
            in_array($extension, $this->extensionesPermitidas, true)
            || ($extension === 'bin' && (str_starts_with($target, 'legacy/js/models/') || str_starts_with($target, 'js/models/')))
        ) {
            return 'permitido';
        }

        return 'bloqueado';
    }

    private function tienePrefijoPermitido(string $target): bool
    {
        foreach ($this->prefijosPermitidos as $prefijo) {
            if (str_starts_with($target, $prefijo)) {
                return true;
            }
        }

        return false;
    }
}
