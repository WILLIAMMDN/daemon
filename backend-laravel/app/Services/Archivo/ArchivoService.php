<?php

namespace App\Services\Archivo;

use App\Models\Usuario;
use Illuminate\Http\UploadedFile;

class ArchivoService
{
    public function __construct(private readonly ArchivoUrlService $urls) {}

    public function guardar(Usuario $usuario, UploadedFile $archivo, ?string $carpeta = null): array
    {
        $ruta = $this->guardarRuta($usuario, $archivo, $this->directorioPublico($usuario, $carpeta ?? 'general'));

        return [
            'ruta' => $ruta,
            'url' => $this->urls->url($ruta),
            'disk' => $this->disk(),
        ];
    }

    public function guardarRuta(Usuario $usuario, UploadedFile $archivo, string $carpeta): string
    {
        return $archivo->store(trim($carpeta, '/'), $this->disk());
    }

    public function url(?string $ruta): ?string
    {
        return $this->urls->url($ruta);
    }

    private function disk(): string
    {
        return env('UPLOADS_DISK', 'public') ?: 'public';
    }

    public function directorioPerfil(Usuario $usuario, string $tipo): string
    {
        $tipo = match ($tipo) {
            'avatar' => 'avatar',
            'fondo' => 'fondos',
            'heroe' => 'heroes',
            default => 'general',
        };

        return "uploads/perfiles/{$usuario->id}/{$tipo}";
    }

    public function directorioBot(Usuario $usuario): string
    {
        return "uploads/bots/{$usuario->id}/avatar";
    }

    public function directorioEntrega(Usuario $usuario): string
    {
        return "uploads/entregas/{$usuario->id}";
    }

    private function directorioPublico(Usuario $usuario, string $carpeta): string
    {
        return match ($carpeta) {
            'avatar' => $this->directorioPerfil($usuario, 'avatar'),
            'fondo', 'fondos' => $this->directorioPerfil($usuario, 'fondo'),
            'heroe', 'heroes' => $this->directorioPerfil($usuario, 'heroe'),
            'perfil', 'perfiles' => "uploads/perfiles/{$usuario->id}/general",
            'bot', 'bots' => $this->directorioBot($usuario),
            'entrega', 'entregas', 'evidencia', 'evidencias' => $this->directorioEntrega($usuario),
            'cuento', 'cuentos' => "uploads/cuentos/{$usuario->id}",
            default => "uploads/general/{$usuario->id}",
        };
    }
}
