<?php

namespace App\Services\Chatbot\Providers;

use App\Models\BotAlumno;
use App\Services\Chatbot\Contracts\AiProviderInterface;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class OpenRouterProvider implements AiProviderInterface
{
    public function responder(BotAlumno $bot, array $mensajes): string
    {
        $apiKey = env('OPENROUTER_API_KEY');
        if (empty($apiKey)) {
            throw new RuntimeException('La API Key de OpenRouter no esta configurada en el servidor.');
        }

        array_unshift($mensajes, [
            'role' => 'system',
            'content' => trim(($bot->system_prompt ?: 'Eres un tutor educativo amable para estudiantes rurales.')."\nConocimiento del bot: ".($bot->conocimiento ?: 'general')),
        ]);

        $respuesta = Http::withToken($apiKey)
            ->timeout(120)
            ->post('https://openrouter.ai/api/v1/chat/completions', [
                'model' => $bot->modelo_ia ?: 'meta-llama/llama-3.3-70b-instruct:free',
                'messages' => $mensajes,
            ])->throw()->json('choices.0.message.content');

        if (! is_string($respuesta) || $respuesta === '') {
            throw new RuntimeException('OpenRouter devolvio una respuesta vacia.');
        }

        return $respuesta;
    }

    public function obtenerModelos(): array
    {
        // Modelos gratuitos activos de OpenRouter
        return [
            ['id' => 'openrouter/free', 'nombre' => 'Automático (Siempre Gratis)'],
            ['id' => 'meta-llama/llama-3.3-70b-instruct:free', 'nombre' => 'Llama 3.3 70B (Meta)'],
            ['id' => 'meta-llama/llama-3.2-3b-instruct:free', 'nombre' => 'Llama 3.2 3B (Meta)'],
            ['id' => 'google/gemma-4-31b-it:free', 'nombre' => 'Gemma 4 31B (Google)'],
            ['id' => 'google/gemma-4-26b-a4b-it:free', 'nombre' => 'Gemma 4 26B (Google)'],
            ['id' => 'nousresearch/hermes-3-llama-3.1-405b:free', 'nombre' => 'Hermes 3 405B'],
        ];
    }
}
