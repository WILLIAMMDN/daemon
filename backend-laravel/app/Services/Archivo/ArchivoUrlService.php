<?php

namespace App\Services\Archivo;

use Illuminate\Support\Str;

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

        if (Str::startsWith($limpia, ['http://', 'https://', 'data:'])) {
            return $limpia;
        }

        $normalizada = $this->normalizarRuta(ltrim($limpia, '/'));
        $baseCloud = $this->baseCloud();

        if (Str::startsWith($normalizada, 'storage/uploads/')) {
            $normalizada = Str::after($normalizada, 'storage/');
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

    private function normalizarRuta(string $ruta): string
    {
        return $ruta === 'img/bot_default.png' ? 'img/bot_default.svg' : $ruta;
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
