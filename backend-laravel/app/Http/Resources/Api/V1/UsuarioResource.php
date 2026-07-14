<?php

namespace App\Http\Resources\Api\V1;

use App\Services\Archivo\ArchivoUrlService;
use App\Services\Gamificacion\GamificacionService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UsuarioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $archivos = app(ArchivoUrlService::class);
        $gamificacion = app(GamificacionService::class);
        $user = $request->user();
        $isSelfOrPrivileged = !$user || $user->id === $this->id || in_array($user->rol, ['admin', 'docente']);
        $experiencia = (int) ($this->experiencia ?? 0);
        $progreso = $gamificacion->progreso($experiencia);

        return [
            'id' => $this->id,
            'nombre_completo' => $this->nombre_completo,
            'email' => $this->when($isSelfOrPrivileged, $this->email),
            'telefono' => $this->when($isSelfOrPrivileged, $this->telefono),
            'usuario' => $this->usuario,
            'nivel' => $this->nivel,
            'tokens' => $this->when($isSelfOrPrivileged, $this->tokens),
            'experiencia' => $experiencia,
            'nivel_gamificacion' => $progreso['nivel'],
            'progreso_nivel' => $progreso,
            'pro_tokens' => $this->when($isSelfOrPrivileged, $this->pro_tokens),
            'rango' => $this->rango,
            'biografia' => $this->biografia,
            'avatar' => $archivos->url($this->avatar),
            'perfil_completo' => (bool) ($this->perfil_completo ?? true),
            'tour_completado' => (bool) $this->tour_completado,
            'email_verificado' => $this->when($isSelfOrPrivileged, $this->hasVerifiedEmail()),
            'email_verified_at' => $this->when($isSelfOrPrivileged, optional($this->email_verified_at)->toIso8601String()),
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
