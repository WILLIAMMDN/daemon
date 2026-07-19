<?php

namespace App\Enums;

enum MascotaSlot: string
{
    case FONDO = 'fondo';
    case ESPALDA = 'espalda';
    case PIEL = 'piel';
    case ATUENDO = 'atuendo';
    case OJOS = 'ojos';
    case ROSTRO = 'rostro';
    case CUELLO = 'cuello';
    case CABEZA = 'cabeza';
    case MANO = 'mano';
    case AURA = 'aura';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function etiqueta(): string
    {
        return match ($this) {
            self::FONDO => 'Fondos',
            self::ESPALDA => 'Espalda',
            self::PIEL => 'Skins',
            self::ATUENDO => 'Atuendos',
            self::OJOS => 'Ojos',
            self::ROSTRO => 'Rostro',
            self::CUELLO => 'Cuello',
            self::CABEZA => 'Cabeza',
            self::MANO => 'Manos',
            self::AURA => 'Efectos',
        };
    }

    public function ordenSugerido(): int
    {
        return match ($this) {
            self::FONDO => -100,
            self::ESPALDA => -10,
            self::PIEL => 10,
            self::ATUENDO => 20,
            self::OJOS => 30,
            self::ROSTRO => 35,
            self::CUELLO => 40,
            self::CABEZA => 50,
            self::MANO => 60,
            self::AURA => 100,
        };
    }
}
