<?php

namespace App\Services\Proyecto;

use App\Models\Usuario;
use Illuminate\Support\Facades\DB;

class ProyectoService
{
    /**
     * Construye el hub desde artefactos que ya pertenecen al alumno. No crea
     * una segunda fuente de verdad para cuentos, bots ni experimentos.
     *
     * @return array<string, mixed>
     */
    public function catalogo(Usuario $alumno): array
    {
        $cuento = DB::table('cuentos')
            ->where('id_alumno', $alumno->id)
            ->select('id', 'titulo', 'fecha_creacion')
            ->first();
        $bot = DB::table('bots_alumnos')
            ->where('id_alumno', $alumno->id)
            ->select('id', 'nombre_bot', 'nivel_entrenamiento', 'fecha_creacion')
            ->first();
        $modelosIa = DB::table('ia_modelos')->where('id_alumno', $alumno->id)->count();
        $laboratorio = DB::table('neuro_maze_stats')
            ->where('id_alumno', $alumno->id)
            ->select('episodios_totales', 'mejor_tiempo_pasos', 'updated_at')
            ->first();
        $cuentosComunidad = DB::table('cuentos')
            ->whereNotNull('titulo')
            ->whereRaw("TRIM(titulo) <> ''")
            ->count();

        $categorias = [
            [
                'slug' => 'cuentos',
                'nombre' => 'Historias y cuentos',
                'etiqueta' => 'Narrativa digital',
                'descripcion' => 'Crea una historia por escenas y descubre las publicaciones de la comunidad DAEMON.',
                'ruta' => '/alumno/proyectos/cuentos',
                'accion' => 'Explorar historias',
                'metricas' => [
                    ['valor' => $cuento ? 1 : 0, 'etiqueta' => 'cuento propio'],
                    ['valor' => $cuentosComunidad, 'etiqueta' => 'historias en la galería'],
                ],
                'tiene_actividad' => (bool) $cuento,
            ],
            [
                'slug' => 'ia-aplicada',
                'nombre' => 'IA aplicada',
                'etiqueta' => 'Asistentes y modelos',
                'descripcion' => 'Configura tu bot educativo y continúa los modelos de inteligencia artificial que ya guardaste.',
                'ruta' => '/alumno/herramientas/bot',
                'accion' => $bot ? 'Continuar mi bot' : 'Configurar mi bot',
                'metricas' => [
                    ['valor' => $bot ? 1 : 0, 'etiqueta' => 'bot configurado'],
                    ['valor' => $modelosIa, 'etiqueta' => 'modelos guardados'],
                ],
                'tiene_actividad' => (bool) $bot || $modelosIa > 0,
            ],
            [
                'slug' => 'laboratorio-ia',
                'nombre' => 'Laboratorio interactivo',
                'etiqueta' => 'Experimentación',
                'descripcion' => 'Prueba estrategias, entrena sistemas y observa resultados dentro del laboratorio de DAEMON.',
                'ruta' => '/alumno/herramientas/laboratorio',
                'accion' => 'Entrar al laboratorio',
                'metricas' => [
                    ['valor' => (int) ($laboratorio->episodios_totales ?? 0), 'etiqueta' => 'episodios registrados'],
                    [
                        'valor' => $this->mejorMarca($laboratorio?->mejor_tiempo_pasos),
                        'etiqueta' => 'mejor marca en pasos',
                    ],
                ],
                'tiene_actividad' => (int) ($laboratorio->episodios_totales ?? 0) > 0,
            ],
        ];

        return [
            'resumen' => [
                'areas_disponibles' => count($categorias),
                'areas_exploradas' => collect($categorias)->where('tiene_actividad', true)->count(),
                'proyectos_personales' => ($cuento ? 1 : 0) + ($bot ? 1 : 0) + $modelosIa,
            ],
            'categorias' => $categorias,
        ];
    }

    private function mejorMarca(mixed $valor): ?int
    {
        $pasos = (int) ($valor ?? 0);

        return $pasos > 0 && $pasos < 9999 ? $pasos : null;
    }
}
