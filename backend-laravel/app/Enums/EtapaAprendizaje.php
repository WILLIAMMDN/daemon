<?php

namespace App\Enums;

enum EtapaAprendizaje: string
{
    case INICIAL = 'inicial';
    case INTERMEDIA = 'intermedia';
    case AVANZADA = 'avanzada';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
