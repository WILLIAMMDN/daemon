<?php

namespace App\Services\Alumno;

use App\Models\Aula;
use App\Models\Usuario;
use App\Services\Archivo\ArchivoUrlService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AlumnoAdminService
{
    public function __construct(private readonly ArchivoUrlService $archivos) {}

    /**
     * Lista usuarios (alumnos, docentes, admins) con paginacion, busqueda y
     * conteos basicos de cada uno.
     *
     * @return array{data: \Illuminate\Support\Collection<int, object>, total: int, page: int, per_page: int, last_page: int, filtros: array<string, mixed>}
     */
    public function listar(Request $request): array
    {
        $perPage = max(1, min(100, (int) $request->query('per_page', 20)));
        $page = max(1, (int) $request->query('page', 1));

        $query = DB::table('usuarios as u')
            ->leftJoin('aulas as a', 'a.id', '=', 'u.id_aula')
            ->leftJoin('instituciones as i', 'i.id', '=', 'u.id_institucion')
            ->select(
                'u.id',
                'u.nombre_completo',
                'u.usuario',
                'u.email',
                'u.nivel',
                'u.rol',
                'u.tokens',
                'u.pro_tokens',
                'u.rango',
                'u.avatar',
                'u.id_aula',
                'u.id_institucion',
                'u.fecha_registro',
                'u.perfil_completo',
                'u.email_verified_at',
                'a.nombre as aula_nombre',
                'i.nombre as institucion_nombre'
            );

        if ($rol = $request->query('rol')) {
            $roles = is_array($rol) ? $rol : explode(',', (string) $rol);
            $roles = array_values(array_filter(array_map('trim', $roles)));
            if ($roles) {
                $query->whereIn('u.rol', $roles);
            }
        } else {
            $query->whereIn('u.rol', ['alumno', 'docente', 'admin']);
        }

        if ($nivel = $request->query('nivel')) {
            $query->where('u.nivel', $nivel);
        }

        if ($idAula = $request->query('id_aula')) {
            $query->where('u.id_aula', (int) $idAula);
        }

        if ($idInstitucion = $request->query('id_institucion')) {
            $query->where('u.id_institucion', (int) $idInstitucion);
        }

        if ($busqueda = trim((string) $request->query('q', ''))) {
            $busquedaLower = mb_strtolower($busqueda);
            $query->where(function ($sub) use ($busquedaLower) {
                $sub->whereRaw('LOWER(u.nombre_completo) LIKE ?', ["%{$busquedaLower}%"])
                    ->orWhereRaw('LOWER(u.usuario) LIKE ?', ["%{$busquedaLower}%"])
                    ->orWhereRaw('LOWER(u.email) LIKE ?', ["%{$busquedaLower}%"]);
            });
        }

        $total = (clone $query)->count();

        $data = $query
            ->orderBy('u.nombre_completo')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get()
            ->map(fn (object $registro) => $this->usuarioConUrl($registro));

        return [
            'data' => $data,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'last_page' => max(1, (int) ceil($total / $perPage)),
            'filtros' => [
                'q' => $request->query('q'),
                'rol' => $request->query('rol'),
                'nivel' => $request->query('nivel'),
                'id_aula' => $request->query('id_aula'),
                'id_institucion' => $request->query('id_institucion'),
                'per_page' => $perPage,
            ],
        ];
    }

    public function detalle(Usuario $usuario): array
    {
        $usuario->avatar = $this->archivos->url($usuario->avatar);

        $metricas = DB::query()
            ->selectSub(DB::table('entregas')->where('id_alumno', $usuario->id)->selectRaw('count(*)'), 'entregas_total')
            ->selectSub(DB::table('entregas')->where('id_alumno', $usuario->id)->where('estado', 'aprobado')->selectRaw('count(*)'), 'entregas_aprobadas')
            ->selectSub(DB::table('canjes')->where('id_alumno', $usuario->id)->selectRaw('count(*)'), 'canjes_total')
            ->selectSub(DB::table('insignias_otorgadas')->where('id_alumno', $usuario->id)->selectRaw('count(*)'), 'insignias_total')
            ->selectSub(DB::table('bots_alumnos')->where('id_alumno', $usuario->id)->selectRaw('count(*)'), 'bots_total')
            ->selectSub(DB::table('cuentos')->where('id_alumno', $usuario->id)->selectRaw('count(*)'), 'cuentos_total')
            ->first();

        return [
            'usuario' => $usuario,
            'metricas' => [
                'entregas_total' => (int) ($metricas->entregas_total ?? 0),
                'entregas_aprobadas' => (int) ($metricas->entregas_aprobadas ?? 0),
                'canjes_total' => (int) ($metricas->canjes_total ?? 0),
                'insignias_total' => (int) ($metricas->insignias_total ?? 0),
                'bots_total' => (int) ($metricas->bots_total ?? 0),
                'cuentos_total' => (int) ($metricas->cuentos_total ?? 0),
            ],
        ];
    }

    public function crear(array $datos): Usuario
    {
        return DB::transaction(function () use ($datos) {
            $tokensIniciales = (int) ($datos['tokens_iniciales'] ?? 0);
            $proTokensIniciales = (int) ($datos['pro_tokens_iniciales'] ?? 0);
            unset($datos['tokens_iniciales'], $datos['pro_tokens_iniciales']);

            $datos['password_hash'] = Hash::make($datos['password']);
            unset($datos['password']);

            $datos['tokens'] = $tokensIniciales;
            $datos['pro_tokens'] = $proTokensIniciales;
            $datos['perfil_completo'] = $datos['perfil_completo'] ?? true;
            $datos['fecha_registro'] = now();

            if (! empty($datos['id_aula'])) {
                $aula = Aula::find($datos['id_aula']);
                $datos['id_institucion'] = $datos['id_institucion'] ?? ($aula?->id_institucion);
            }

            return Usuario::create($datos);
        });
    }

    public function actualizar(Usuario $usuario, array $datos): Usuario
    {
        return DB::transaction(function () use ($usuario, $datos) {
            if (! empty($datos['password'])) {
                $datos['password_hash'] = Hash::make($datos['password']);
                unset($datos['password']);
            } else {
                unset($datos['password']);
            }

            if (array_key_exists('id_aula', $datos) && ! empty($datos['id_aula'])) {
                $aula = Aula::find($datos['id_aula']);
                if ($aula && empty($datos['id_institucion'])) {
                    $datos['id_institucion'] = $aula->id_institucion;
                }
            }

            $usuario->fill($datos)->save();

            return $usuario->fresh();
        });
    }

    /**
     * Elimina un usuario. Bloquea si tiene dependencias criticas que no se
     * pueden limpiar automaticamente (entregas pendientes, canjes
     * pendientes, cuentos publicados). Las dependencias no criticas se
     * limpian en cascada via FK.
     */
    public function eliminar(Usuario $usuario): void
    {
        DB::transaction(function () use ($usuario) {
            $entregasPendientes = DB::table('entregas')
                ->where('id_alumno', $usuario->id)
                ->where('estado', 'pendiente')
                ->count();
            abort_if(
                $entregasPendientes > 0,
                422,
                "No se puede eliminar el usuario porque tiene {$entregasPendientes} entrega(s) pendiente(s)."
            );

            $canjesPendientes = DB::table('canjes')
                ->where('id_alumno', $usuario->id)
                ->where('estado', 'pendiente')
                ->count();
            abort_if(
                $canjesPendientes > 0,
                422,
                "No se puede eliminar el usuario porque tiene {$canjesPendientes} canje(s) pendiente(s)."
            );

            DB::table('cuentos')->where('id_alumno', $usuario->id)->delete();
            DB::table('bots_alumnos')->where('id_alumno', $usuario->id)->delete();
            DB::table('chat_mensajes')->where('id_alumno', $usuario->id)->delete();
            DB::table('insignias_otorgadas')->where('id_alumno', $usuario->id)->delete();
            DB::table('historial_movimientos')->where('id_alumno', $usuario->id)->delete();
            DB::table('respuestas_examen')->where('alumno_id', $usuario->id)->delete();
            DB::table('ia_modelos')->where('id_alumno', $usuario->id)->delete();
            DB::table('neuro_maze_stats')->where('id_alumno', $usuario->id)->delete();
            DB::table('votos_live')->where('id_alumno_juez', $usuario->id)->orWhere('id_alumno_candidato', $usuario->id)->delete();
            DB::table('chat_live')->where('id_usuario', $usuario->id)->delete();

            $usuario->delete();
        });
    }

    /**
     * Reset rapido de clave para un usuario. Devuelve la nueva clave en
     * texto plano (solo se devuelve al admin que ejecuta la accion).
     */
    public function resetearClave(Usuario $usuario): array
    {
        $nuevaClave = bin2hex(random_bytes(4));
        $usuario->password_hash = Hash::make($nuevaClave);
        $usuario->save();

        return [
            'usuario_id' => $usuario->id,
            'usuario' => $usuario->usuario,
            'clave_temporal' => $nuevaClave,
        ];
    }

    public function estadisticas(): array
    {
        return [
            'alumnos' => DB::table('usuarios')->where('rol', 'alumno')->count(),
            'docentes' => DB::table('usuarios')->where('rol', 'docente')->count(),
            'admins' => DB::table('usuarios')->where('rol', 'admin')->count(),
            'verificados' => DB::table('usuarios')->whereNotNull('email_verified_at')->count(),
            'con_perfil_completo' => DB::table('usuarios')->where('perfil_completo', true)->count(),
            'sin_aula' => DB::table('usuarios')->where('rol', 'alumno')->whereNull('id_aula')->count(),
            'tokens_totales' => (int) DB::table('usuarios')->where('rol', 'alumno')->sum('tokens'),
        ];
    }

    private function usuarioConUrl(object $registro): object
    {
        $registro->avatar = $this->archivos->url($registro->avatar ?? null);

        return $registro;
    }
}