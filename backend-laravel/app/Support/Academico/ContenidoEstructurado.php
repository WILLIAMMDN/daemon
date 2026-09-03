<?php

namespace App\Support\Academico;

/**
 * Normalización sin pérdida de `experiencias_aprendizaje.contenido`.
 *
 * El Learning Core ya guarda contenido pedagógico estructurado como
 * `['tipo' => 'leccion_estructurada', 'bloques' => [...]]`. Cada bloque tiene un
 * `tipo` libre y, según el tipo, un `texto`, un `titulo` y una lista cuyo nombre
 * de clave varía entre autores históricos (`pasos`, `campos`, `preguntas`,
 * `elementos`, `requisitos`, `casos`...).
 *
 * Studio NO reemplaza esa estructura por un blob HTML ni por un page builder.
 * La lee a una forma canónica de autoría y la vuelve a escribir respetando la
 * clave de lista original de cada bloque, de modo que IA: Origen sobrevive
 * intacto a un roundtrip de edición.
 */
final class ContenidoEstructurado
{
    public const TIPO_ESTRUCTURADO = 'leccion_estructurada';

    /**
     * Claves de lista conocidas en el contenido histórico, en orden de prioridad.
     */
    private const CLAVES_LISTA = ['pasos', 'campos', 'preguntas', 'preguntas_clave', 'preguntas_informe', 'elementos', 'requisitos', 'casos', 'criterios'];

    /**
     * Tipos de bloque que Studio ofrece al crear contenido nuevo. Los tipos
     * heredados fuera de esta lista se preservan y se siguen editando.
     *
     * @return list<string>
     */
    public static function tiposDeBloque(): array
    {
        return ['concepto', 'ejemplo', 'instrucciones', 'pasos', 'pregunta', 'reflexion', 'criterios_exito'];
    }

    /**
     * Contenido normalizado para el contrato de lectura de autoría.
     *
     * @return array{format: string, summary: string|null, blocks: list<array<string, mixed>>, raw: array<string, mixed>|null}
     */
    public static function leer(?array $contenido): array
    {
        if ($contenido === null || $contenido === []) {
            return ['format' => 'empty', 'summary' => null, 'blocks' => [], 'raw' => null];
        }

        $bloques = $contenido['bloques'] ?? null;

        if (! is_array($bloques)) {
            // Contenido plano histórico (por ejemplo ['resumen' => '...']).
            return [
                'format' => 'plain',
                'summary' => isset($contenido['resumen']) && is_string($contenido['resumen']) ? $contenido['resumen'] : null,
                'blocks' => [],
                'raw' => $contenido,
            ];
        }

        return [
            'format' => 'structured',
            'summary' => isset($contenido['resumen']) && is_string($contenido['resumen']) ? $contenido['resumen'] : null,
            'blocks' => array_values(array_filter(array_map(
                static fn ($bloque): ?array => is_array($bloque) ? self::leerBloque($bloque) : null,
                $bloques,
            ))),
            'raw' => null,
        ];
    }

    /**
     * @param  array<string, mixed>  $bloque
     * @return array<string, mixed>
     */
    private static function leerBloque(array $bloque): array
    {
        $claveLista = null;
        $items = [];

        foreach (self::CLAVES_LISTA as $clave) {
            if (isset($bloque[$clave]) && is_array($bloque[$clave])) {
                $claveLista = $clave;
                $items = array_values(array_filter($bloque[$clave], 'is_string'));
                break;
            }
        }

        $conocidas = array_merge(['tipo', 'titulo', 'texto'], self::CLAVES_LISTA);
        $extras = array_diff_key($bloque, array_flip($conocidas));

        return [
            'type' => is_string($bloque['tipo'] ?? null) ? $bloque['tipo'] : 'concepto',
            'title' => isset($bloque['titulo']) && is_string($bloque['titulo']) ? $bloque['titulo'] : null,
            'text' => isset($bloque['texto']) && is_string($bloque['texto']) ? $bloque['texto'] : null,
            'items' => $items,
            'itemsKey' => $claveLista,
            // Campos heredados que Studio no edita pero tampoco destruye.
            'extras' => $extras === [] ? null : $extras,
        ];
    }

    /**
     * Reconstruye el contenido persistible desde la forma canónica de autoría.
     *
     * @param  array<string, mixed>  $entrada
     * @return array<string, mixed>|null
     */
    public static function escribir(array $entrada): ?array
    {
        // Contenido histórico plano: se devuelve tal cual, sin reinterpretarlo.
        if (! is_array($entrada['blocks'] ?? null) && is_array($entrada['raw'] ?? null)) {
            return $entrada['raw'] === [] ? null : $entrada['raw'];
        }

        $bloques = [];

        foreach (is_array($entrada['blocks'] ?? null) ? $entrada['blocks'] : [] as $bloque) {
            if (! is_array($bloque)) {
                continue;
            }

            $persistido = is_array($bloque['extras'] ?? null) ? $bloque['extras'] : [];
            $persistido['tipo'] = is_string($bloque['type'] ?? null) && $bloque['type'] !== '' ? $bloque['type'] : 'concepto';

            if (isset($bloque['title']) && is_string($bloque['title']) && $bloque['title'] !== '') {
                $persistido['titulo'] = $bloque['title'];
            }
            if (isset($bloque['text']) && is_string($bloque['text']) && $bloque['text'] !== '') {
                $persistido['texto'] = $bloque['text'];
            }

            $items = array_values(array_filter(
                is_array($bloque['items'] ?? null) ? $bloque['items'] : [],
                static fn ($item): bool => is_string($item) && trim($item) !== '',
            ));

            if ($items !== []) {
                $clave = is_string($bloque['itemsKey'] ?? null) && in_array($bloque['itemsKey'], self::CLAVES_LISTA, true)
                    ? $bloque['itemsKey']
                    : 'elementos';
                $persistido[$clave] = $items;
            }

            $bloques[] = $persistido;
        }

        $resumen = isset($entrada['summary']) && is_string($entrada['summary']) && $entrada['summary'] !== '' ? $entrada['summary'] : null;

        if ($bloques === [] && $resumen === null) {
            return null;
        }

        $contenido = ['tipo' => self::TIPO_ESTRUCTURADO];
        if ($resumen !== null) {
            $contenido['resumen'] = $resumen;
        }
        $contenido['bloques'] = $bloques;

        return $contenido;
    }

    /**
     * Errores de forma del contenido enviado por un cliente de autoría.
     *
     * @return list<string>
     */
    public static function errores(?array $entrada): array
    {
        if ($entrada === null) {
            return [];
        }

        $bloques = $entrada['blocks'] ?? null;
        if ($bloques !== null && ! is_array($bloques)) {
            return ['El contenido estructurado debe declarar una lista de bloques.'];
        }

        if (is_array($bloques) && count($bloques) > 60) {
            return ['Una experiencia admite como máximo 60 bloques de contenido.'];
        }

        $errores = [];
        foreach (is_array($bloques) ? $bloques : [] as $bloque) {
            if (! is_array($bloque)) {
                $errores[] = 'Cada bloque de contenido debe ser un objeto.';
                break;
            }
            if (isset($bloque['type']) && (! is_string($bloque['type']) || mb_strlen($bloque['type']) > 40)) {
                $errores[] = 'El tipo de bloque debe ser texto de hasta 40 caracteres.';
                break;
            }
        }

        return $errores;
    }
}
