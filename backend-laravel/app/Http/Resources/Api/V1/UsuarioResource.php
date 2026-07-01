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
            'email_verificado' => $this->hasVerifiedEmail(),
            'email_verified_at' => optional($this->email_verified_at)->toIso8601String(),
            'rol' => $this->rol,
            'id_institucion' => $this->id_institucion,
            'id_aula' => $this->id_aula,
            'aula' => $this->whenLoaded('aula', fn () => $this->aula ? [
                'id' => $this->aula->id,
                'nombre' => $this->aula->nombre,
                'nivel' => $this->aula->nivel,
                'codigo' => $this->aula->codigo,
                'institucion' => $this->aula->relationLoaded('institucion') && $this->aula->institucion ? [
                    'id' => $this->aula->institucion->id,
                    'nombre' => $this->aula->institucion->nombre,
                    'slug' => $this->aula->institucion->slug,
                ] : null,
            ] : null),
            'insignia' => $this->insignia,
            'mision_actual' => $this->mision_actual,
            'fondo' => $archivos->url($this->fondo),
            'heroe' => $archivos->url($this->heroe),
            'genero' => $this->genero,
            'fecha_registro' => $this->fecha_registro,
        ];
    }
}
