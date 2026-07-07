<?php

namespace App\Services\Comunidad;

use App\Models\ChatLive;
use App\Models\Usuario;
use App\Services\Academico\AcademicScopeService;
use App\Services\Archivo\ArchivoUrlService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ComunidadService
{
    public function __construct(
        private readonly ArchivoUrlService $archivos,
        private readonly AcademicScopeService $alcance,
    ) {}

    /**
     * Lista mensajes de la comunidad con paginacion, busqueda y alcance.
     *
     * @return array{data: \Illuminate\Support\Collection<int, object>, total: int, page: int, per_page: int, last_page: int, filtros: array<string, mixed>}
     */
    public function listarMensajes(Request $request): array
    {
        $perPage = max(1, min(100, (int) $request->query('per_page', 20)));
        $page = max(1, (int) $request->query('page', 1));

        $query = DB::table('chat_live as c')
            ->join('usuarios as u', 'u.id', '=', 'c.id_usuario')
            ->leftJoin('aulas as a', 'a.id', '=', 'u.id_aula')
            ->select(
                'c.id',
                'c.id_usuario',
                'c.nombre',
                'c.mensaje',
                'c.rol',
                'c.fecha',
                'u.nombre_completo as autor',
                'u.usuario as autor_usuario',
                'u.nivel as autor_nivel',
                'u.avatar as autor_avatar',
                'u.id_aula as autor_aula',
                'a.nombre as aula_nombre'
            );

        $actor = $request->user();
        $this->alcance->aplicarAlumnosQuery($query, $actor, 'u.id_aula');

        if ($busqueda = trim((string) $request->query('q', ''))) {
            $busquedaLower = mb_strtolower($busqueda);
            $query->where(function ($sub) use ($busquedaLower) {
                $sub->whereRaw('LOWER(c.mensaje) LIKE ?', ["%{$busquedaLower}%"])
                    ->orWhereRaw('LOWER(c.nombre) LIKE ?', ["%{$busquedaLower}%"])
                    ->orWhereRaw('LOWER(u.nombre_completo) LIKE ?', ["%{$busquedaLower}%"]);
            });
        }

        if ($rol = $request->query('rol')) {
            $query->where('c.rol', $rol);
        }

        if ($desde = $request->query('desde')) {
            $query->where('c.fecha', '>=', $desde);
        }

        if ($hasta = $request->query('hasta')) {
            $query->where('c.fecha', '<=', $hasta);
        }

        $total = (clone $query)->count();

        $data = $query
            ->orderByDesc('c.fecha')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get()
            ->map(fn (object $registro) => $this->mensajeConUrl($registro));

        return [
            'data' => $data,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'last_page' => max(1, (int) ceil($total / $perPage)),
            'filtros' => [
                'q' => $request->query('q'),
                'rol' => $request->query('rol'),
                'desde' => $request->query('desde'),
                'hasta' => $request->query('hasta'),
                'per_page' => $perPage,
            ],
        ];
    }

    /**
     * Crea un mensaje en la comunidad en nombre del actor (docente/admin) o
     * del usuario indicado en id_usuario. Valida que el usuario exista y
     * pertenezca al alcance academico si el actor es docente.
     */
    public function crearMensaje(Usuario $actor, array $datos): ChatLive
    {
        $usuarioId = $datos['id_usuario'] ?? $actor->id;
        $usuario = Usuario::find($usuarioId);
        abort_unless($usuario, 422, 'Usuario indicado no existe.');

        if ($actor->rol === 'docente') {
            $this->alcance->alumnoGestionable($actor, (int) $usuario->id, true);
        }

        $rol = $datos['rol'] ?? $actor->rol;

        $mensaje = ChatLive::create([
            'id_usuario' => $usuario->id,
            'nombre' => $usuario->nombre_completo,
            'mensaje' => trim($datos['mensaje']),
            'rol' => $rol,
            'fecha' => now(),
        ]);

        return $mensaje;
    }

    /**
     * Elimina un mensaje de la comunidad. Docentes solo pueden eliminar
     * mensajes de usuarios en su alcance academico.
     */
    public function eliminarMensaje(Usuario $actor, ChatLive $mensaje): void
    {
        $autor = Usuario::find($mensaje->id_usuario);
        if ($autor && $actor->rol === 'docente') {
            $this->alcance->alumnoGestionable($actor, (int) $autor->id, true);
        }

        $mensaje->delete();
    }

    /**
     * Elimina multiples mensajes en bulk. Devuelve la cantidad eliminada.
     *
     * @param  array<int, int>  $ids
     */
    public function eliminarMensajesBulk(Usuario $actor, array $ids): int
    {
        abort_if($ids === [], 422, 'No se proporcionaron ids.');

        $eliminados = 0;
        DB::transaction(function () use ($actor, $ids, &$eliminados) {
            foreach ($ids as $idRaw) {
                $id = (int) $idRaw;
                $mensaje = ChatLive::find($id);
                if (! $mensaje) {
                    continue;
                }
                $this->eliminarMensaje($actor, $mensaje);
                $eliminados++;
            }
        });

        return $eliminados;
    }

    /**
     * Estadisticas rapidas para el panel admin de comunidad.
     *
     * @return array<string, int>
     */
    public function estadisticas(Request $request): array
    {
        $query = DB::table('chat_live as c')
            ->join('usuarios as u', 'u.id', '=', 'c.id_usuario');

        $actor = $request->user();
        $this->alcance->aplicarAlumnosQuery($query, $actor, 'u.id_aula');

        $total = (clone $query)->count();
        $hoy = (clone $query)->whereDate('c.fecha', today())->count();
        $ultimos7 = (clone $query)->where('c.fecha', '>=', now()->subDays(7))->count();
        $docentes = (clone $query)->where('c.rol', 'docente')->count();
        $alumnos = (clone $query)->where('c.rol', 'alumno')->count();

        return [
            'total' => $total,
            'hoy' => $hoy,
            'ultimos_7_dias' => $ultimos7,
            'docentes' => $docentes,
            'alumnos' => $alumnos,
        ];
    }

    private function mensajeConUrl(object $registro): object
    {
        $registro->autor_avatar = $this->archivos->url($registro->autor_avatar ?? null);

        return $registro;
    }
}