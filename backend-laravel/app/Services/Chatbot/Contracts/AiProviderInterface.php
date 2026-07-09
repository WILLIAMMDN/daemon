<?php

namespace App\Services\Chatbot\Contracts;

use App\Models\BotAlumno;

interface AiProviderInterface
{
    /**
     * Envia una conversacion al proveedor de IA y retorna la respuesta.
     */
    public function responder(BotAlumno $bot, array $mensajes): string;

    /**
     * Obtiene la lista de modelos disponibles para este proveedor.
     */
    public function obtenerModelos(): array;
}
