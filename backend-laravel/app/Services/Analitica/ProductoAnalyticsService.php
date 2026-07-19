<?php

namespace App\Services\Analitica;

use App\Models\EventoProducto;
use App\Models\Usuario;
use Illuminate\Support\Str;

class ProductoAnalyticsService
{
    public const EVENTOS_PERMITIDOS = [
        'module_opened', 'lesson_started', 'lesson_completed', 'mission_submitted',
        'evaluation_completed', 'store_purchase_completed', 'mascot_customized', 'lti_launch_completed',
    ];

    private const PROPIEDADES_PERMITIDAS = [
        'module', 'course_id', 'lesson_id', 'mission_id', 'evaluation_id', 'item_id',
        'duration_bucket', 'result_bucket', 'entry_point', 'device_class',
    ];

    public function registrar(Usuario $usuario, array $datos): EventoProducto
    {
        $propiedades = array_intersect_key($datos['propiedades'] ?? [], array_flip(self::PROPIEDADES_PERMITIDAS));
        $propiedades = array_map(fn ($value) => is_scalar($value) ? mb_substr((string) $value, 0, 120) : null, $propiedades);

        return EventoProducto::create([
            'uuid' => (string) Str::uuid(),
            'id_usuario' => $usuario->id,
            'id_institucion' => $usuario->id_institucion,
            'nombre' => $datos['nombre'],
            'sesion_hash' => ! empty($datos['sesion_id']) ? hash('sha256', $datos['sesion_id'].config('app.key')) : null,
            'propiedades' => array_filter($propiedades, fn ($value) => $value !== null),
            'ocurrido_at' => now(),
        ]);
    }
}
