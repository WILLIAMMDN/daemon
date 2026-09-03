<?php

namespace App\Support\Academico;

use App\Enums\ModalidadEvidencia;

/**
 * Lectura y escritura canónica de `experiencias_aprendizaje.guia_entrega`.
 *
 * `guia_entrega` ya existía como columna JSON libre con la guía pedagógica de
 * IA: Origen. Course Operations V1 no la reemplaza: le añade dos claves
 * canónicas y deja intacto todo lo demás.
 *
 *   evidencia => ['modalidades' => [...], 'obligatoria' => bool,
 *                 'minimo_artefactos' => int, 'notas' => string|null]
 *   rubrica   => ['titulo' => string|null, 'criterios' => [
 *                    ['codigo' => ..., 'titulo' => ..., 'descripcion' => ...], ...]]
 *
 * Compatibilidad hacia atrás: `rubrica_referencia` (lista plana de strings, la
 * forma que usa hoy el capstone de IA: Origen) se lee como rúbrica derivada. Al
 * guardar una rúbrica canónica se migra esa clave heredada en el mismo borrador.
 */
final class GuiaEntrega
{
    public const CLAVE_EVIDENCIA = 'evidencia';

    public const CLAVE_RUBRICA = 'rubrica';

    public const CLAVE_RUBRICA_HEREDADA = 'rubrica_referencia';

    /**
     * Errores de forma de la configuración de evidencia y rúbrica.
     *
     * @return list<string>
     */
    public static function errores(?array $guia): array
    {
        if ($guia === null) {
            return [];
        }

        $errores = [];
        $evidencia = $guia[self::CLAVE_EVIDENCIA] ?? null;

        if ($evidencia !== null) {
            if (! is_array($evidencia)) {
                $errores[] = 'La configuración de evidencia debe ser un objeto.';
            } else {
                $modalidades = $evidencia['modalidades'] ?? [];
                if (! is_array($modalidades)) {
                    $errores[] = 'Las modalidades de evidencia deben ser una lista.';
                } else {
                    foreach ($modalidades as $modalidad) {
                        if (! is_string($modalidad) || ModalidadEvidencia::tryFrom($modalidad) === null) {
                            $errores[] = 'Modalidad de evidencia no reconocida.';
                            break;
                        }
                    }
                }
                $minimo = $evidencia['minimo_artefactos'] ?? 0;
                if (! is_int($minimo) || $minimo < 0 || $minimo > 10) {
                    $errores[] = 'El mínimo de artefactos debe ser un entero entre 0 y 10.';
                }
                if (array_key_exists('obligatoria', $evidencia) && ! is_bool($evidencia['obligatoria'])) {
                    $errores[] = 'El campo obligatoria de la evidencia debe ser booleano.';
                }
                if (isset($evidencia['notas']) && (! is_string($evidencia['notas']) || mb_strlen($evidencia['notas']) > 2000)) {
                    $errores[] = 'Las notas de evidencia deben ser texto de hasta 2000 caracteres.';
                }
            }
        }

        $rubrica = $guia[self::CLAVE_RUBRICA] ?? null;
        if ($rubrica !== null) {
            if (! is_array($rubrica)) {
                $errores[] = 'La rúbrica debe ser un objeto.';
            } else {
                $criterios = $rubrica['criterios'] ?? [];
                if (! is_array($criterios)) {
                    $errores[] = 'Los criterios de la rúbrica deben ser una lista.';
                } elseif (count($criterios) > 20) {
                    $errores[] = 'Una rúbrica admite como máximo 20 criterios.';
                } else {
                    foreach ($criterios as $criterio) {
                        if (! is_array($criterio) || ! isset($criterio['titulo']) || ! is_string($criterio['titulo']) || trim($criterio['titulo']) === '') {
                            $errores[] = 'Cada criterio de rúbrica necesita un título.';
                            break;
                        }
                    }
                }
            }
        }

        return $errores;
    }

    /**
     * Configuración de evidencia normalizada para el contrato de lectura.
     *
     * @return array{modalities: list<string>, required: bool, minimumArtifacts: int, notes: string|null, configured: bool}
     */
    public static function evidencia(?array $guia): array
    {
        $bruto = is_array($guia[self::CLAVE_EVIDENCIA] ?? null) ? $guia[self::CLAVE_EVIDENCIA] : null;
        $modalidades = [];

        foreach (is_array($bruto['modalidades'] ?? null) ? $bruto['modalidades'] : [] as $modalidad) {
            if (is_string($modalidad) && ModalidadEvidencia::tryFrom($modalidad) !== null && ! in_array($modalidad, $modalidades, true)) {
                $modalidades[] = $modalidad;
            }
        }

        return [
            'modalities' => $modalidades,
            'required' => (bool) ($bruto['obligatoria'] ?? ($modalidades !== [])),
            'minimumArtifacts' => (int) ($bruto['minimo_artefactos'] ?? 0),
            'notes' => isset($bruto['notas']) && is_string($bruto['notas']) ? $bruto['notas'] : null,
            'configured' => $bruto !== null,
        ];
    }

    /**
     * Rúbrica formativa normalizada; deriva la forma heredada cuando existe.
     *
     * @return array{title: string|null, criteria: list<array{code: string, title: string, description: string|null}>, legacy: bool}|null
     */
    public static function rubrica(?array $guia): ?array
    {
        $canonica = is_array($guia[self::CLAVE_RUBRICA] ?? null) ? $guia[self::CLAVE_RUBRICA] : null;

        if ($canonica !== null) {
            $criterios = [];
            foreach (is_array($canonica['criterios'] ?? null) ? $canonica['criterios'] : [] as $indice => $criterio) {
                if (! is_array($criterio) || ! isset($criterio['titulo']) || ! is_string($criterio['titulo'])) {
                    continue;
                }
                $criterios[] = [
                    'code' => isset($criterio['codigo']) && is_string($criterio['codigo']) && $criterio['codigo'] !== ''
                        ? $criterio['codigo']
                        : 'C'.($indice + 1),
                    'title' => $criterio['titulo'],
                    'description' => isset($criterio['descripcion']) && is_string($criterio['descripcion']) ? $criterio['descripcion'] : null,
                ];
            }

            return [
                'title' => isset($canonica['titulo']) && is_string($canonica['titulo']) ? $canonica['titulo'] : null,
                'criteria' => $criterios,
                'legacy' => false,
            ];
        }

        $heredada = $guia[self::CLAVE_RUBRICA_HEREDADA] ?? null;
        if (! is_array($heredada) || $heredada === []) {
            return null;
        }

        $criterios = [];
        foreach (array_values($heredada) as $indice => $titulo) {
            if (is_string($titulo) && trim($titulo) !== '') {
                $criterios[] = ['code' => 'C'.($indice + 1), 'title' => $titulo, 'description' => null];
            }
        }

        return $criterios === [] ? null : ['title' => null, 'criteria' => $criterios, 'legacy' => true];
    }

    /**
     * Deja la guía lista para persistir: al escribir una rúbrica canónica se
     * retira la forma heredada para no dejar dos fuentes de verdad.
     */
    public static function paraPersistir(?array $guia): ?array
    {
        if ($guia === null) {
            return null;
        }

        if (is_array($guia[self::CLAVE_RUBRICA] ?? null)) {
            unset($guia[self::CLAVE_RUBRICA_HEREDADA]);
        }

        return $guia === [] ? null : $guia;
    }
}
