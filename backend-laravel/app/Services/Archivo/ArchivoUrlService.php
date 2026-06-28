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

        $normalizada = ltrim($limpia, '/');
        $baseCloud = rtrim((string) env('ASSET_CLOUD_URL', ''), '/');

        if ($baseCloud !== '' && Str::startsWith($normalizada, 'uploads/')) {
            return $baseCloud.'/'.$normalizada;
        }

        if (Str::startsWith($normalizada, 'storage/')) {
            return rtrim(env('APP_URL', 'http://localhost'), '/').'/'.$normalizada;
        }

        if ($this->esRutaPublica($normalizada)) {
            return '/'.$normalizada;
        }

        return rtrim(env('APP_URL', 'http://localhost'), '/').'/storage/'.$normalizada;
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
