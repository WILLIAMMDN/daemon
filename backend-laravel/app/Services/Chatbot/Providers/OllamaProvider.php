<?php

namespace App\Services\Chatbot\Providers;

use App\Models\BotAlumno;
use App\Services\Chatbot\Contracts\AiProviderInterface;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class OllamaProvider implements AiProviderInterface
{
    public function responder(BotAlumno $bot, array $mensajes): string
    {
        array_unshift($mensajes, [
            'role' => 'system',
            'content' => trim(($bot->system_prompt ?: 'Eres un tutor educativo amable para estudiantes rurales.')."\nConocimiento del bot: ".($bot->conocimiento ?: 'general')),
        ]);

        $respuesta = Http::timeout(120)
            ->post(rtrim(env('OLLAMA_URL', 'http://127.0.0.1:11434'), '/').'/api/chat', [
                'model' => $bot->modelo_ia ?: 'gemma2:9b',
                'messages' => $mensajes,
                'stream' => false,
            ])->throw()->json('message.content');

        if (! is_string($respuesta) || $respuesta === '') {
            throw new RuntimeException('Ollama devolvio una respuesta vacia.');
        }

        return $respuesta;
    }

    public function obtenerModelos(): array
    {
        try {
            $tags = Http::timeout(5)
                ->get(rtrim(env('OLLAMA_URL', 'http://127.0.0.1:11434'), '/').'/api/tags')
                ->json('models');

            if (! is_array($tags)) {
                return [];
            }

            return array_map(fn($model) => [
                'id' => $model['name'],
                'nombre' => $model['name'],
            ], $tags);
        } catch (\Exception $e) {
            return [];
        }
    }
}
