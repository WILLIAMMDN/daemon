<?php

namespace App\Support\Autoria;

use Laravel\Sanctum\PersonalAccessToken;
use Laravel\Sanctum\TransientToken;

/**
 * Alcances canónicos de un token de servicio de autoría (MCP y equivalentes).
 *
 * Un cliente headless nunca recibe `*`: recibe exactamente las capacidades que
 * necesita. La publicación tiene su propio alcance y deliberadamente NO se
 * concede a los tokens de servicio de V1: publicar sigue siendo un acto humano
 * a través de Course Studio.
 */
final class AlcanceAutoria
{
    /** Lectura del árbol de autoría y del catálogo canónico. */
    public const LECTURA = 'course:read';

    /** Creación y mutación de borradores. Nunca toca una versión publicada. */
    public const ESCRITURA = 'course:write';

    /**
     * Publicación / archivado. Existe para que la comprobación sea explícita
     * del lado del servidor, no para concederse a un cliente automatizado.
     */
    public const PUBLICACION = 'course:publish';

    /**
     * Alcances que un token de servicio puede declarar.
     *
     * @return list<string>
     */
    public static function values(): array
    {
        return [self::LECTURA, self::ESCRITURA, self::PUBLICACION];
    }

    /**
     * Alcances que un token de servicio MCP recibe por defecto.
     *
     * @return list<string>
     */
    public static function porDefectoMcp(): array
    {
        return [self::LECTURA, self::ESCRITURA];
    }

    /**
     * Normaliza una lista de alcances solicitados; descarta lo desconocido.
     *
     * @param  iterable<mixed>  $alcances
     * @return list<string>
     */
    public static function normalizar(iterable $alcances): array
    {
        $validos = [];

        foreach ($alcances as $alcance) {
            $alcance = is_string($alcance) ? trim($alcance) : '';
            if (in_array($alcance, self::values(), true) && ! in_array($alcance, $validos, true)) {
                $validos[] = $alcance;
            }
        }

        return $validos;
    }

    /**
     * Un token de servicio es el que declara únicamente alcances canónicos de
     * autoría y jamás el comodín `*`.
     *
     * @param  array<int, mixed>|null  $abilities
     */
    public static function esDeServicio(?array $abilities): bool
    {
        if ($abilities === null || $abilities === []) {
            return false;
        }

        foreach ($abilities as $ability) {
            if (! is_string($ability) || ! in_array($ability, self::values(), true)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Los tokens de servicio se rigen por su propio `expires_at` y no por la
     * ventana deslizante de sesión interactiva (`sanctum.expiration`), pensada
     * para el navegador. Siguen siendo finitos, hasheados y revocables.
     */
    public static function esTokenDeServicioValido(mixed $token): bool
    {
        if ($token instanceof TransientToken || ! $token instanceof PersonalAccessToken) {
            return false;
        }

        if (! self::esDeServicio($token->abilities) || $token->expires_at === null) {
            return false;
        }

        return ! $token->expires_at->isPast();
    }
}
