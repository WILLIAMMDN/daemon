<?php

namespace App\Enums;

enum MascotaRareza: string
{
    case COMUN = 'comun';
    case ESPECIAL = 'especial';
    case EPICO = 'epico';
    case LEGENDARIO = 'legendario';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
