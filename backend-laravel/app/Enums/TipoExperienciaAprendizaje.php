<?php

namespace App\Enums;

enum TipoExperienciaAprendizaje: string
{
    case LECCION = 'leccion';
    case PRACTICA = 'practica';
    case MISION = 'mision';
    case LABORATORIO = 'laboratorio';
    case EVALUACION = 'evaluacion';
    case PROYECTO = 'proyecto';
    case DESAFIO = 'desafio';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
