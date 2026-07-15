<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class MigrarEntregasAStoragePrivado extends Command
{
    protected $signature = 'daemon:migrar-entregas-privadas
        {--confirm : Copia y verifica los objetos en el bucket privado}
        {--delete-source : Elimina el objeto publico solo despues de verificar la copia}';

    protected $description = 'Copia evidencias de misiones al bucket privado sin cambiar sus rutas logicas';

    public function handle(): int
    {
        $confirm = (bool) $this->option('confirm');
        $deleteSource = (bool) $this->option('delete-source');

        if ($deleteSource && ! $confirm) {
            $this->error('--delete-source requiere --confirm.');

            return self::INVALID;
        }

        $publicDiskName = env('UPLOADS_DISK', 'public') ?: 'public';
        $privateDiskName = (string) config('daemon.private_uploads_disk', 'supabase_private');

        if ($publicDiskName === $privateDiskName) {
            $this->error('Los discos publico y privado no pueden ser el mismo.');

            return self::FAILURE;
        }

        $public = Storage::disk($publicDiskName);
        $private = Storage::disk($privateDiskName);
        $summary = ['candidates' => 0, 'copied' => 0, 'already_private' => 0, 'missing' => 0, 'deleted_public' => 0];

        DB::table('entregas')
            ->select('id', 'archivo_url')
            ->whereNotNull('archivo_url')
            ->orderBy('id')
            ->each(function (object $delivery) use ($confirm, $deleteSource, $public, $private, &$summary): void {
                $path = $this->managedPath((string) $delivery->archivo_url);
                if ($path === null) {
                    return;
                }

                $summary['candidates']++;
                if (! $confirm) {
                    return;
                }

                if (! $private->exists($path)) {
                    if (! $public->exists($path)) {
                        $summary['missing']++;

                        return;
                    }

                    $stream = $public->readStream($path);
                    if (! is_resource($stream)) {
                        throw new RuntimeException('No se pudo leer una evidencia publica.');
                    }

                    try {
                        $private->writeStream($path, $stream);
                    } finally {
                        fclose($stream);
                    }

                    if (! $private->exists($path) || $private->size($path) !== $public->size($path)) {
                        throw new RuntimeException('La copia privada no supero la verificacion de integridad.');
                    }

                    $summary['copied']++;
                } else {
                    $summary['already_private']++;
                }

                if ((string) $delivery->archivo_url !== $path) {
                    DB::table('entregas')->where('id', $delivery->id)->update(['archivo_url' => $path]);
                }

                if ($deleteSource && $public->exists($path) && $public->delete($path)) {
                    $summary['deleted_public']++;
                }
            });

        $this->table(['metrica', 'cantidad'], collect($summary)->map(
            static fn (int $value, string $key): array => [$key, $value]
        )->values()->all());

        if (! $confirm) {
            $this->warn('Simulacion terminada. Usa --confirm para copiar; agrega --delete-source solo despues de tener backup.');
        }

        return $summary['missing'] > 0 ? self::FAILURE : self::SUCCESS;
    }

    private function managedPath(string $value): ?string
    {
        $path = trim($value);
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            $urlPath = parse_url($path, PHP_URL_PATH);
            if (! is_string($urlPath)) {
                return null;
            }

            $position = strpos($urlPath, '/uploads/entregas/');
            if ($position === false) {
                return null;
            }

            $path = ltrim(substr($urlPath, $position + 1), '/');
        }

        $path = str_starts_with($path, 'storage/') ? substr($path, strlen('storage/')) : $path;

        return str_starts_with($path, 'uploads/entregas/') ? $path : null;
    }
}
