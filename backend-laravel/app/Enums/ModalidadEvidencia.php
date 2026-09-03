<?php

namespace App\Enums;

/**
 * Modalidades canónicas de evidencia que una experiencia puede aceptar.
 *
 * Son la contraparte de autoría del Evidence & Artifact System V1:
 *  - TEXTO / ESTRUCTURADA viajan en `evidencias_aprendizaje`
 *    (`referencia` y `metadatos` respectivamente).
 *  - IMAGEN / PDF / ENLACE_EXTERNO viajan en `artefactos_aprendizaje`
 *    (categorías `image`, `document` y `external_link`).
 *
 * Studio configura QUÉ se espera. La plataforma sigue decidiendo DÓNDE y CÓMO
 * se almacena: proveedores de storage y seguridad de archivos no se configuran
 * desde autoría.
 */
enum ModalidadEvidencia: string
{
    case TEXTO = 'text';
    case ESTRUCTURADA = 'structured';
    case IMAGEN = 'image';
    case PDF = 'pdf';
    case ENLACE_EXTERNO = 'external_link';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Modalidades que se materializan como artefacto adjunto.
     *
     * @return list<string>
     */
    public static function modalidadesDeArtefacto(): array
    {
        return [self::IMAGEN->value, self::PDF->value, self::ENLACE_EXTERNO->value];
    }
}
