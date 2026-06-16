<?php

namespace App\Services\Chatbot;

use App\Models\BotAlumno;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class OllamaService
{
    public function responder(BotAlumno $bot, array $mensajes): string
    {
        array_unshift($mensajes, [
            'role' => 'system',
            'content' => trim(($bot->system_prompt ?: 'Eres un tutor educativo amable para estudiantes rurales.').'\nConocimiento del bot: '.($bot->conocimiento ?: 'general')),
        ]);

        $respuesta = Http::timeout(120)
            ->post(rtrim(env('OLLAMA_URL', 'http://127.0.0.1:11434'), '/').'/api/chat', [
                'model' => env('OLLAMA_MODEL', 'gemma2:9b'),
                'messages' => $mensajes,
                'stream' => false,
            ])->throw()->json('message.content');

        if (! is_string($respuesta) || $respuesta === '') {
            throw new RuntimeException('Ollama devolvio una respuesta vacia.');
        }

        return $respuesta;
    }
}
