<?php

namespace App\Services\Chatbot;

use App\Models\BotAlumno;
use App\Models\ChatMensaje;
use App\Models\Usuario;
use App\Services\Archivo\ArchivoUrlService;
use App\Services\Academico\AcademicScopeService;
use App\Services\Chatbot\Providers\OllamaProvider;
use App\Services\Chatbot\Providers\OpenRouterProvider;
use App\Services\Chatbot\Contracts\AiProviderInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ChatbotService
{
    public function __construct(
        private readonly ArchivoUrlService $archivos,
        private readonly AcademicScopeService $alcance,
    ) {}

    public function bot(Usuario $alumno): ?BotAlumno
    {
        return $this->botConUrls(BotAlumno::where('id_alumno', $alumno->id)->first());
    }

    public function guardarBot(Usuario $alumno, array $datos): BotAlumno
    {
        return $this->botConUrls(BotAlumno::updateOrCreate(['id_alumno' => $alumno->id], $datos));
    }

    public function mensajes(Usuario $alumno): Collection
    {
        return ChatMensaje::where('id_alumno', $alumno->id)->orderBy('created_at')->get();
    }

    private function getProvider(string $providerName): AiProviderInterface
    {
        if ($providerName === 'openrouter') {
            return new OpenRouterProvider();
        }
        
        return new OllamaProvider();
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

        $provider = $this->getProvider($bot->proveedor ?: 'ollama');
        $respuesta = $provider->responder($bot, $historial);

        return ChatMensaje::create(['id_alumno' => $alumno->id, 'role' => 'assistant', 'content' => $respuesta]);
    }

    public function obtenerModelos(): array
    {
        $ollama = new OllamaProvider();
        $openrouter = new OpenRouterProvider();

        return [
            'ollama' => $ollama->obtenerModelos(),
            'openrouter' => $openrouter->obtenerModelos(),
        ];
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

        return $this->botConUrls($bot->fresh());
    }

    private function botConUrls(?BotAlumno $bot): ?BotAlumno
    {
        if ($bot) {
            $bot->avatar = $this->archivos->url($bot->avatar);
        }

        return $bot;
    }

    /**
     * Lista todos los bots visibles para el actor (docente/admin).
     *
     * - Si es admin: ve todos los bots.
     * - Si es docente: solo los bots de alumnos dentro de su alcance académico.
     * - Permite filtrar por nombre de bot, nombre de alumno y paginar.
     *
     * @return array{data: \Illuminate\Support\Collection<int, object>, total: int, page: int, per_page: int, last_page: int, filtros: array<string, mixed>}
     */
    public function adminListar(Request $request): array
    {
        $perPage = max(1, min(100, (int) $request->query('per_page', 20)));
        $page = max(1, (int) $request->query('page', 1));

        $query = DB::table('bots_alumnos as b')
            ->join('usuarios as u', 'u.id', '=', 'b.id_alumno')
            ->leftJoin('aulas as a', 'a.id', '=', 'u.id_aula')
            ->select(
                'b.id',
                'b.id_alumno',
                'b.nombre_bot',
                'b.avatar',
                'b.nivel_entrenamiento',
                'b.victorias',
                'b.fecha_creacion',
                'u.nombre_completo as alumno',
                'u.usuario as alumno_usuario',
                'u.nivel as alumno_nivel',
                'u.id_aula as alumno_aula',
                'a.nombre as aula_nombre'
            );

        $actor = $request->user();
        $this->alcance->aplicarAlumnosQuery($query, $actor, 'u.id_aula');

        if ($busqueda = trim((string) $request->query('q', ''))) {
            $busquedaLower = mb_strtolower($busqueda);
            $query->where(function ($sub) use ($busquedaLower) {
                $sub->whereRaw('LOWER(b.nombre_bot) LIKE ?', ["%{$busquedaLower}%"])
                    ->orWhereRaw('LOWER(u.nombre_completo) LIKE ?', ["%{$busquedaLower}%"])
                    ->orWhereRaw('LOWER(u.usuario) LIKE ?', ["%{$busquedaLower}%"]);
            });
        }

        if ($nivel = $request->query('nivel')) {
            $query->where('u.nivel', $nivel);
        }

        if ($minNivel = $request->query('min_nivel_entrenamiento')) {
            $query->where('b.nivel_entrenamiento', '>=', (int) $minNivel);
        }

        $total = (clone $query)->count();

        $data = $query
            ->orderByDesc('b.fecha_creacion')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get()
            ->map(fn (object $registro) => $this->adminBotConUrls($registro));

        return [
            'data' => $data,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'last_page' => max(1, (int) ceil($total / $perPage)),
            'filtros' => [
                'q' => $request->query('q'),
                'nivel' => $request->query('nivel'),
                'min_nivel_entrenamiento' => $request->query('min_nivel_entrenamiento'),
                'per_page' => $perPage,
            ],
        ];
    }

    /**
     * Obtiene el detalle de un bot para vista admin con datos del alumno.
     */
    public function adminDetalle(Usuario $actor, BotAlumno $bot): array
    {
        $alumno = Usuario::find($bot->id_alumno);
        abort_unless($alumno, 404, 'Alumno del bot no encontrado.');

        if ($actor->rol === 'docente') {
            $this->alcance->alumnoGestionable($actor, (int) $alumno->id);
        }

        $registro = DB::table('bots_alumnos as b')
            ->join('usuarios as u', 'u.id', '=', 'b.id_alumno')
            ->leftJoin('aulas as a', 'a.id', '=', 'u.id_aula')
            ->where('b.id', $bot->id)
            ->select(
                'b.*',
                'u.nombre_completo as alumno',
                'u.usuario as alumno_usuario',
                'u.nivel as alumno_nivel',
                'u.id_aula as alumno_aula',
                'a.nombre as aula_nombre'
            )
            ->first();

        abort_unless($registro, 404, 'Bot no encontrado.');

        $registro->avatar = $this->archivos->url($registro->avatar);
        $registro->alumno_avatar = $this->archivos->url(optional($alumno)->avatar);

        $totalMensajes = ChatMensaje::where('id_alumno', $bot->id_alumno)->count();

        return [
            'bot' => $registro,
            'total_mensajes' => $totalMensajes,
        ];
    }

    /**
     * Actualiza un bot en nombre de un docente/admin (no es el alumno dueño).
     */
    public function adminActualizar(Usuario $actor, BotAlumno $bot, array $datos): BotAlumno
    {
        $alumno = Usuario::find($bot->id_alumno);
        abort_unless($alumno, 404, 'Alumno del bot no encontrado.');

        if ($actor->rol === 'docente') {
            $this->alcance->alumnoGestionable($actor, (int) $alumno->id);
        }

        $camposPermitidos = array_intersect_key($datos, array_flip([
            'nombre_bot',
            'system_prompt',
            'conocimiento',
            'nivel_entrenamiento',
            'victorias',
            'avatar',
        ]));

        if ($camposPermitidos !== []) {
            $bot->fill($camposPermitidos)->save();
        }

        return $this->botConUrls($bot->fresh());
    }

    /**
     * Elimina un bot con cascade de mensajes del alumno. Docentes solo pueden
     * eliminar bots de alumnos en su alcance.
     */
    public function adminEliminar(Usuario $actor, BotAlumno $bot): void
    {
        $alumno = Usuario::find($bot->id_alumno);
        abort_unless($alumno, 404, 'Alumno del bot no encontrado.');

        if ($actor->rol === 'docente') {
            $this->alcance->alumnoGestionable($actor, (int) $alumno->id);
        }

        DB::transaction(function () use ($bot, $alumno) {
            ChatMensaje::where('id_alumno', $alumno->id)->delete();
            $bot->delete();
        });
    }

    /**
     * Resetea (limpia) el chat del bot sin eliminarlo. Útil para moderación
     * cuando un alumno acumuló mensajes inapropiados.
     */
    public function adminLimpiarChat(Usuario $actor, BotAlumno $bot): int
    {
        $alumno = Usuario::find($bot->id_alumno);
        abort_unless($alumno, 404, 'Alumno del bot no encontrado.');

        if ($actor->rol === 'docente') {
            $this->alcance->alumnoGestionable($actor, (int) $alumno->id);
        }

        return ChatMensaje::where('id_alumno', $alumno->id)->delete();
    }

    private function adminBotConUrls(object $registro): object
    {
        $registro->avatar = $this->archivos->url($registro->avatar);

        return $registro;
    }
}
