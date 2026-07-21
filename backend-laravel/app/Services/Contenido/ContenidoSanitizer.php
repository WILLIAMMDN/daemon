<?php

namespace App\Services\Contenido;

use DOMDocument;
use DOMElement;
use DOMNode;

/**
 * Sanitizador de HTML para contenido generado por usuarios en DAEMON.
 *
 * Por que existe:
 *   Los campos `contenido` de los cuentos y mensajes de comunidad se
 *   renderizan en el navegador con `quill-view-html` o equivalente.
 *   Sin sanitizacion, un alumno podria enviar <script>, onerror=,
 *   javascript:, SVG malicioso, etc. y comprometer la sesion de otros
 *   usuarios.
 *
 * Politica (whitelist, OWASP ASVS V5.22 / V5.23):
 *   - Tags permitidos: <p> <h1>..<h6> <strong> <em> <u> <s>
 *     <a> <img> <blockquote> <pre> <ol> <ul> <li> <br> <span>
 *   - Atributos permitidos: href (a), src/alt/title (img), title (a).
 *   - URLs: solo https:, http:, mailto:, tel:. Bloquea javascript:,
 *     data:, vbscript:, file:, etc.
 *   - Tamaño maximo configurable (default 200 KB) para evitar
 *     abuso de almacenamiento y DoS.
 *
 * No es HTMLPurifier. Si el proyecto crece a millones de usuarios o
 * admite tipos de contenido mas complejos (tablas, listas anidadas,
 * formulas, etc.), considerar migrar a ezyang/htmlpurifier.
 */
class ContenidoSanitizer
{
    public const TAMANO_MAXIMO_BYTES = 200 * 1024; // 200 KB

    private const TAGS_PERMITIDOS = [
        'p' => ['class'],
        'h1' => [],
        'h2' => [],
        'h3' => [],
        'h4' => [],
        'h5' => [],
        'h6' => [],
        'strong' => [],
        'em' => [],
        'u' => [],
        's' => [],
        'a' => ['href', 'title'],
        'img' => ['src', 'alt', 'title'],
        'blockquote' => [],
        'pre' => [],
        'ol' => [],
        'ul' => [],
        'li' => [],
        'br' => [],
        'span' => ['class'],
    ];

    private const ESQUEMAS_URL_PERMITIDOS = ['http', 'https', 'mailto', 'tel'];

    /**
     * Sanitiza HTML crudo. Devuelve el HTML limpio, o string vacio
     * si el input es vacio o demasiado grande.
     *
     * @throws ContenidoDemasiadoGrandeException
     */
    public function sanitizar(?string $htmlCrudo, ?int $tamanoMaximo = null): string
    {
        if ($htmlCrudo === null) {
            return '';
        }

        $htmlCrudo = trim($htmlCrudo);

        if ($htmlCrudo === '') {
            return '';
        }

        $tamanoMaximo = $tamanoMaximo ?? self::TAMANO_MAXIMO_BYTES;

        if (strlen($htmlCrudo) > $tamanoMaximo) {
            throw new ContenidoDemasiadoGrandeException(sprintf(
                'El contenido excede el tamano maximo permitido (%d KB).',
                intdiv($tamanoMaximo, 1024),
            ));
        }

        $dom = $this->parsearSeguro($htmlCrudo);

        if ($dom === null) {
            return '';
        }

        $cuerpo = $dom->getElementsByTagName('body')->item(0);
        if ($cuerpo === null) {
            return '';
        }

        $this->limpiarRecursivo($cuerpo);

        $salida = '';
        foreach ($cuerpo->childNodes as $nodo) {
            $salida .= $dom->saveHTML($nodo);
        }

        return trim($salida);
    }

    /**
     * Parsea HTML con libxml seguro. Suprime warnings de malformed HTML
     * y desactiva DTD loading (prevencion XXE - OWASP A05:2025).
     */
    private function parsearSeguro(string $html): ?DOMDocument
    {
        $prev = [
            'use_errors' => libxml_use_internal_errors(true),
            'entity_loader' => null,
        ];

        $anteriorLoader = null;
        if (LIBXML_VERSION >= 20900) {
            $anteriorLoader = libxml_disable_entity_loader(true);
        }

        try {
            $dom = new DOMDocument('1.0', 'UTF-8');
            // Forzamos utf-8 y un wrapper para que reconozca los acentos.
            $envuelto = '<?xml encoding="utf-8"?><div>' . $html . '</div>';
            $dom->loadHTML($envuelto, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD | LIBXML_NONET);
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($prev['use_errors']);
            if (LIBXML_VERSION >= 20900 && $anteriorLoader !== null) {
                libxml_disable_entity_loader($anteriorLoader);
            }
        }

        return $dom;
    }

    /**
     * Recorre el arbol DOM, eliminando tags/atributos no permitidos y
     * normalizando URLs.
     */
    private function limpiarRecursivo(DOMNode $nodo): void
    {
        if (! $nodo->hasChildNodes()) {
            return;
        }

        // Copiamos los hijos porque la coleccion es live y la vamos a modificar.
        $hijos = [];
        foreach ($nodo->childNodes as $hijo) {
            $hijos[] = $hijo;
        }

        foreach ($hijos as $hijo) {
            if ($hijo instanceof DOMElement) {
                $tag = strtolower($hijo->nodeName);

                if (! array_key_exists($tag, self::TAGS_PERMITIDOS)) {
                    // Reemplazar el nodo por el contenido de sus hijos
                    // (asi <script>alert(1)</script> se vuelve "alert(1)" en texto,
                    // no en codigo ejecutable).
                    while ($hijo->firstChild) {
                        $nodo->insertBefore($hijo->firstChild, $hijo);
                    }
                    $nodo->removeChild($hijo);
                    continue;
                }

                $this->limpiarAtributos($hijo);
            } elseif ($hijo->nodeType === XML_PI_NODE || $hijo->nodeType === XML_DOCUMENT_TYPE_NODE) {
                // Eliminar processing instructions y DOCTYPE (defensa XXE).
                $nodo->removeChild($hijo);
                continue;
            }

            $this->limpiarRecursivo($hijo);
        }
    }

    private function limpiarAtributos(DOMElement $elemento): void
    {
        $tag = strtolower($elemento->nodeName);
        $permitidos = self::TAGS_PERMITIDOS[$tag] ?? [];

        $atributos = [];
        foreach ($elemento->attributes as $attr) {
            $atributos[] = $attr->nodeName;
        }

        foreach ($atributos as $nombre) {
            $nombreLower = strtolower($nombre);

            // Rechazar cualquier atributo on* (onclick, onerror, onload...).
            if (str_starts_with($nombreLower, 'on')) {
                $elemento->removeAttribute($nombre);
                continue;
            }

            if (! in_array($nombreLower, $permitidos, true)) {
                $elemento->removeAttribute($nombre);
            }
        }

        // Validar href y src contra la lista blanca de esquemas.
        foreach (['href', 'src'] as $atributoUrl) {
            $valor = $elemento->getAttribute($atributoUrl);
            if ($valor !== '' && ! $this->esquemaUrlValido($valor)) {
                $elemento->removeAttribute($atributoUrl);
            }
        }
    }

    private function esquemaUrlValido(string $url): bool
    {
        $url = trim($url);

        if ($url === '') {
            return false;
        }

        // Permitir URLs relativas que empiezan por "/" (rutas internas).
        if (str_starts_with($url, '/') && ! str_starts_with($url, '//')) {
            return true;
        }

        // Bloquear protocol-relative URLs explícitamente (//evil.com).
        if (str_starts_with($url, '//')) {
            return false;
        }

        $partes = parse_url($url);

        // Si no hay scheme, asumimos ruta relativa valida.
        if ($partes === false || ! isset($partes['scheme'])) {
            return true;
        }

        $esquema = strtolower($partes['scheme']);

        return in_array($esquema, self::ESQUEMAS_URL_PERMITIDOS, true);
    }
}
