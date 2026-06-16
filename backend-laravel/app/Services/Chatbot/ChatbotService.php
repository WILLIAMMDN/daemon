<?php

namespace App\Services\Chatbot;

use App\Models\BotAlumno;
use App\Models\ChatMensaje;
use App\Models\Usuario;
use Illuminate\Support\Collection;

class ChatbotService
{
    public function __construct(private readonly OllamaService $ollama) {}

    public function bot(Usuario $alumno): ?BotAlumno
    {
        return BotAlumno::where('id_alumno', $alumno->id)->first();
    }

    public function guardarBot(Usuario $alumno, array $datos): BotAlumno
    {
        return BotAlumno::updateOrCreate(['id_alumno' => $alumno->id], $datos);
    }

    public function mensajes(Usuario $alumno): Collection
    {
        return ChatMensaje::where('id_alumno', $alumno->id)->orderBy('created_at')->get();
    }

    public function responder(Usuario $alumno, string $contenido): ChatMensaje
    {
        $bot = $this->bot($alumno);
        abort_unless($bot, 422, 'Primero configura tu bot.');

        ChatMensaje::create(['id_alumno' => $alumno->id, 'role' => 'user', 'content' => $contenido]);

        $historial = ChatMensaje::where('id_alumno', $alumno->id)
            ->latest('id')
            ->limit(20)
            ->get()
            ->reverse()
            ->values()
            ->map(fn ($mensaje) => ['role' => $mensaje->role, 'content' => $mensaje->content])
            ->all();

        $respuesta = $this->ollama->responder($bot, $historial);

        return ChatMensaje::create(['id_alumno' => $alumno->id, 'role' => 'assistant', 'content' => $respuesta]);
    }

    public function limpiar(Usuario $alumno): void
    {
        ChatMensaje::where('id_alumno', $alumno->id)->delete();
    }

    public function cerebro(Usuario $alumno): mixed
    {
        return BotAlumno::where('id_alumno', $alumno->id)->value('matriz_neural');
    }

    public function guardarCerebro(Usuario $alumno, array $matriz): BotAlumno
    {
        $bot = BotAlumno::firstOrCreate(['id_alumno' => $alumno->id], ['nombre_bot' => 'Mi bot']);
        $bot->update([
            'matriz_neural' => $matriz,
            'nivel_entrenamiento' => ((int) $bot->nivel_entrenamiento) + 1,
        ]);

        return $bot->fresh();
    }
}
