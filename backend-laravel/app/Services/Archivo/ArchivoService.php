<?php

namespace App\Services\Archivo;

use App\Models\Usuario;
use Illuminate\Http\UploadedFile;

class ArchivoService
{
    public function guardar(Usuario $usuario, UploadedFile $archivo, ?string $carpeta = null): array
    {
        $ruta = $archivo->store(($carpeta ?? 'archivos').'/'.$usuario->id, 'public');

        return [
            'ruta' => $ruta,
            'url' => asset('storage/'.$ruta),
        ];
    }
}
