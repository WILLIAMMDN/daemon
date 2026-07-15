<?php

namespace App\Services\Archivo;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ArchivoUrlService
{
    /** @var array<int, string> */
    private array $prefijosPublicos = ['img/', 'legacy/', 'galeria/', 'docs/', 'js/', 'css/', 'audio/', 'rive/'];

    public function url(?string $ruta): ?string
    {
        $limpia = trim((string) $ruta);

        if ($limpia === '') {
            return null;
        }

        if (Str::startsWith($limpia, 'data:')) {
            return $limpia;
        }

        $gestionada = $this->extraerRutaGestionada($limpia);
        if ($gestionada !== null) {
            $limpia = $gestionada;
        } elseif (Str::startsWith($limpia, ['http://', 'https://'])) {
            return $limpia;
        }

        $normalizada = $this->normalizarRuta(ltrim($limpia, '/'));
        $baseCloud = $this->baseCloud();

        if (Str::startsWith($normalizada, 'storage/uploads/')) {
            $normalizada = Str::after($normalizada, 'storage/');
        }

        if ($this->esRutaPrivada($normalizada)) {
            try {
                return Storage::disk((string) config('daemon.private_uploads_disk', 'supabase_private'))
                    ->temporaryUrl(
                        $normalizada,
                        now()->addMinutes(max(1, (int) config('daemon.private_upload_url_minutes', 10))),
                    );
            } catch (Throwable $exception) {
                report($exception);

                return null;
            }
        }

        if ($baseCloud !== '' && Str::startsWith($normalizada, 'uploads/')) {
            return $baseCloud.'/'.$normalizada;
        }

        if (Str::startsWith($normalizada, 'storage/')) {
            return rtrim(env('APP_URL', 'http://localhost'), '/').'/'.$normalizada;
        }

        if ($this->esRutaPublica($normalizada)) {
            $basePublica = $this->basePublica();

            return $basePublica !== '' ? $basePublica.'/'.$normalizada : '/'.$normalizada;
        }

        return rtrim(env('APP_URL', 'http://localhost'), '/').'/storage/'.$normalizada;
    }

    public function esRutaPrivada(string $ruta): bool
    {
        $normalizada = ltrim($this->normalizarRuta($ruta), '/');

        foreach ((array) config('daemon.private_upload_prefixes', ['uploads/entregas/']) as $prefijo) {
            if (is_string($prefijo) && Str::startsWith($normalizada, $prefijo)) {
                return true;
            }
        }

        return false;
    }

    private function normalizarRuta(string $ruta): string
    {
        return $ruta === 'img/bot_default.png' ? 'img/bot_default.svg' : $ruta;
    }

    private function extraerRutaGestionada(string $ruta): ?string
    {
        if (! Str::startsWith($ruta, ['http://', 'https://'])) {
            return null;
        }

        $path = parse_url($ruta, PHP_URL_PATH);
        if (! is_string($path)) {
            return null;
        }

        $marker = '/uploads/';
        $position = strpos($path, $marker);

        return $position === false ? null : ltrim(substr($path, $position + 1), '/');
    }

    private function baseCloud(): string
    {
        $base = config('daemon.asset_cloud_url')
            ?: env('ASSET_CLOUD_URL')
            ?: env('SUPABASE_STORAGE_PUBLIC_URL', '');

        return rtrim((string) $base, '/');
    }

    private function basePublica(): string
    {
        $base = config('daemon.asset_public_url')
            ?: env('ASSET_PUBLIC_URL')
            ?: env('FRONTEND_PRODUCTION_URL')
            ?: env('FRONTEND_URL', '');

        return rtrim((string) $base, '/');
    }

    private function esRutaPublica(string $ruta): bool
    {
        foreach ($this->prefijosPublicos as $prefijo) {
            if (Str::startsWith($ruta, $prefijo)) {
                return true;
            }
        }

        return false;
    }
}
