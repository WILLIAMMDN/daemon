<?php

namespace App\Services\Cuento;

use App\Contracts\Cuento\GeneradorTextoCuento;
use App\Models\BotAlumno;
use App\Models\Usuario;
use App\Services\Chatbot\Providers\OllamaProvider;
use App\Services\Chatbot\Providers\OpenRouterProvider;

class ProveedorChatCuentoAdapter implements GeneradorTextoCuento
{
    public function generar(Usuario $usuario, array $mensajes): string
    {
        $preferencias = BotAlumno::query()->where('id_alumno', $usuario->id)->first();
        $bot = new BotAlumno;
        $bot->forceFill([
            'proveedor' => $preferencias?->proveedor ?: (env('OPENROUTER_API_KEY_NUEVA') ? 'openrouter' : 'ollama'),
            'modelo_ia' => $preferencias?->modelo_ia,
            'system_prompt' => 'Eres el asistente creativo seguro de DAEMON para estudiantes menores de edad.',
            'conocimiento' => 'Escritura creativa, alfabetizaciÃ³n y acompaÃ±amiento pedagÃ³gico.',
        ]);
        $proveedor = $bot->proveedor === 'openrouter'
            ? new OpenRouterProvider
            : new OllamaProvider;

        return $proveedor->responder($bot, $mensajes);
    }
}
