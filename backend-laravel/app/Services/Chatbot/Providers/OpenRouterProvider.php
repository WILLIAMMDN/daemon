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
        return \Illuminate\Support\Facades\Cache::remember('openrouter_free_models', now()->addHours(12), function () {
            try {
                $response = Http::timeout(10)->get('https://openrouter.ai/api/v1/models')->json('data');
                if (!is_array($response)) {
                    return $this->defaultModels();
                }

                $freeModels = [];
                // Siempre añadir openrouter/free como primera opción recomendada
                $freeModels[] = ['id' => 'openrouter/free', 'nombre' => 'Automático (Siempre Gratis)'];

                foreach ($response as $model) {
                    $isFree = false;
                    if (isset($model['pricing']['prompt']) && isset($model['pricing']['completion'])) {
                        if (floatval($model['pricing']['prompt']) === 0.0 && floatval($model['pricing']['completion']) === 0.0) {
                            $isFree = true;
                        }
                    } elseif (str_ends_with($model['id'], ':free')) {
                        $isFree = true;
                    }

                    // Evitar duplicar el openrouter/free y filtrar el auto de pago
                    if ($isFree && $model['id'] !== 'openrouter/free' && $model['id'] !== 'openrouter/auto') {
                        $nombre = $model['name'] ?? $model['id'];
                        // Limpiar nombres largos si es necesario
                        $freeModels[] = [
                            'id' => $model['id'],
                            'nombre' => $nombre,
                        ];
                    }
                }

                return count($freeModels) > 1 ? $freeModels : $this->defaultModels();
            } catch (\Exception $e) {
                return $this->defaultModels();
            }
        });
    }

    private function defaultModels(): array
    {
        return [
            ['id' => 'openrouter/free', 'nombre' => 'Automático (Siempre Gratis)'],
            ['id' => 'meta-llama/llama-3.3-70b-instruct:free', 'nombre' => 'Llama 3.3 70B (Meta)'],
            ['id' => 'meta-llama/llama-3.2-3b-instruct:free', 'nombre' => 'Llama 3.2 3B (Meta)'],
            ['id' => 'google/gemma-2-9b-it:free', 'nombre' => 'Gemma 2 9B (Google)'],
        ];
    }
}
