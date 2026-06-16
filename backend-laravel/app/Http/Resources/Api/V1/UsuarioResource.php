<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UsuarioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nombre_completo' => $this->nombre_completo,
            'email' => $this->email,
            'usuario' => $this->usuario,
            'nivel' => $this->nivel,
            'tokens' => $this->tokens,
            'pro_tokens' => $this->pro_tokens,
            'rango' => $this->rango,
            'biografia' => $this->biografia,
            'avatar' => $this->avatar,
            'rol' => $this->rol,
            'insignia' => $this->insignia,
            'mision_actual' => $this->mision_actual,
            'fondo' => $this->fondo,
            'heroe' => $this->heroe,
            'genero' => $this->genero,
            'fecha_registro' => $this->fecha_registro,
        ];
    }
}
