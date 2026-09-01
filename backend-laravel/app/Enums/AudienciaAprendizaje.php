<?php

namespace App\Enums;

enum AudienciaAprendizaje: string
{
    case KIDS = 'KIDS';
    case TEENS = 'TEENS';
    case TODOS = 'TODOS';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function incluye(string $nivelAlumno): bool
    {
        return $this === self::TODOS || $this->value === $nivelAlumno;
    }
}
