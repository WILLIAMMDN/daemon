<?php

namespace App\Http\Resources\Api\V1;

use App\Services\Archivo\ArchivoUrlService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UsuarioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $archivos = app(ArchivoUrlService::class);

        return [
            'id' => $this->id,
            'nombre_completo' => $this->nombre_completo,
            'email' => $this->email,
            'telefono' => $this->telefono,
            'usuario' => $this->usuario,
            'nivel' => $this->nivel,
            'tokens' => $this->tokens,
            'pro_tokens' => $this->pro_tokens,
            'rango' => $this->rango,
            'biografia' => $this->biografia,
            'avatar' => $archivos->url($this->avatar),
            'perfil_completo' => (bool) ($this->perfil_completo ?? true),
            'rol' => $this->rol,
            'insignia' => $this->insignia,
            'mision_actual' => $this->mision_actual,
            'fondo' => $archivos->url($this->fondo),
            'heroe' => $archivos->url($this->heroe),
            'genero' => $this->genero,
            'fecha_registro' => $this->fecha_registro,
        ];
    }
}
