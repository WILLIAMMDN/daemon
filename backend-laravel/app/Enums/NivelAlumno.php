<?php

namespace App\Enums;

enum NivelAlumno: string
{
    case KIDS = 'KIDS';
    case TEENS = 'TEENS';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * @return list<string>
     */
    public static function conAlcanceGeneral(string $alcance): array
    {
        return [$alcance, ...self::values()];
    }
}
