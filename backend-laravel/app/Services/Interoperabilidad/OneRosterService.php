<?php

namespace App\Services\Interoperabilidad;

use App\Models\Aula;
use App\Models\ClienteOneRoster;
use App\Models\Curso;
use App\Models\Institucion;
use App\Models\MatriculaAula;
use App\Models\PeriodoAcademico;
use App\Models\Usuario;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OneRosterService
{
    public function academicSessions(Request $request, ClienteOneRoster $cliente): JsonResponse
    {
        return $this->coleccion(
            $request,
            PeriodoAcademico::where('id_institucion', $cliente->id_institucion),
            'academicSessions',
            fn ($item) => $this->academicSession($item),
            ['sourcedId' => 'sourced_id', 'status' => 'estado', 'title' => 'titulo', 'type' => 'tipo', 'startDate' => 'fecha_inicio', 'endDate' => 'fecha_fin'],
        );
    }

    public function courses(Request $request, ClienteOneRoster $cliente): JsonResponse
    {
        return $this->coleccion(
            $request,
            Curso::with('institucion')->where('id_institucion', $cliente->id_institucion),
            'courses',
            fn ($item) => $this->course($item),
            ['sourcedId' => 'sourced_id', 'status' => 'estado', 'title' => 'titulo', 'courseCode' => 'codigo'],
        );
    }

    public function classes(Request $request, ClienteOneRoster $cliente): JsonResponse
    {
        return $this->coleccion(
            $request,
            Aula::with(['institucion', 'curso', 'periodoAcademico'])->where('id_institucion', $cliente->id_institucion),
            'classes',
            fn ($item) => $this->classRoom($item),
            ['sourcedId' => 'sourced_id', 'status' => 'estado_interoperabilidad', 'title' => 'nombre', 'classCode' => 'codigo', 'classType' => 'tipo_clase'],
        );
    }

    public function orgs(Request $request, ClienteOneRoster $cliente): JsonResponse
    {
        return $this->coleccion(
            $request,
            Institucion::whereKey($cliente->id_institucion),
            'orgs',
            fn ($item) => $this->org($item),
            ['sourcedId' => 'sourced_id', 'status' => 'estado_interoperabilidad', 'name' => 'nombre', 'identifier' => 'slug'],
        );
    }

    public function users(Request $request, ClienteOneRoster $cliente, ?string $rol = null, ?Aula $aula = null): JsonResponse
    {
        $query = Usuario::query()->with('institucion')->where('id_institucion', $cliente->id_institucion);
        if ($rol) {
            $query->where('rol', $rol);
        }
        if ($aula) {
            abort_unless((int) $aula->id_institucion === (int) $cliente->id_institucion, 404);
            $query->whereHas('matriculas', fn ($matriculas) => $matriculas->where('id_aula', $aula->id)->where('estado', 'active'));
        }

        return $this->coleccion(
            $request,
            $query,
            'users',
            fn ($item) => $this->user($item),
            ['sourcedId' => 'sourced_id', 'status' => 'estado_interoperabilidad', 'username' => 'usuario', 'role' => 'rol', 'email' => 'email'],
        );
    }

    public function enrollments(Request $request, ClienteOneRoster $cliente): JsonResponse
    {
        return $this->coleccion(
            $request,
            MatriculaAula::query()->with(['aula.institucion', 'usuario'])->whereHas('aula', fn ($query) => $query->where('id_institucion', $cliente->id_institucion)),
            'enrollments',
            fn ($item) => $this->enrollment($item),
            ['sourcedId' => 'sourced_id', 'status' => 'estado', 'role' => 'rol', 'primary' => 'es_principal', 'beginDate' => 'fecha_inicio', 'endDate' => 'fecha_fin'],
        );
    }

    public function item(string $tipo, string $sourcedId, ClienteOneRoster $cliente): JsonResponse
    {
        [$modelo, $relaciones, $clave, $mapper] = match ($tipo) {
            'academicSessions' => [PeriodoAcademico::class, [], 'academicSession', fn ($item) => $this->academicSession($item)],
            'courses' => [Curso::class, ['institucion'], 'course', fn ($item) => $this->course($item)],
            'classes' => [Aula::class, ['institucion', 'curso', 'periodoAcademico'], 'class', fn ($item) => $this->classRoom($item)],
            'orgs' => [Institucion::class, [], 'org', fn ($item) => $this->org($item)],
            'users' => [Usuario::class, ['institucion'], 'user', fn ($item) => $this->user($item)],
            'enrollments' => [MatriculaAula::class, ['aula.institucion', 'usuario'], 'enrollment', fn ($item) => $this->enrollment($item)],
            default => abort(404),
        };
        $query = $modelo::query()->with($relaciones)->where('sourced_id', $sourcedId);
        if ($tipo === 'orgs') {
            $query->whereKey($cliente->id_institucion);
        } elseif ($tipo === 'enrollments') {
            $query->whereHas('aula', fn ($builder) => $builder->where('id_institucion', $cliente->id_institucion));
        } else {
            $query->where('id_institucion', $cliente->id_institucion);
        }
        $item = $query->firstOrFail();

        return response()->json([$clave => $mapper($item)]);
    }

    private function coleccion(Request $request, Builder $query, string $clave, callable $mapper, array $campos): JsonResponse
    {
        $this->aplicarFiltro($request, $query, $campos);
        $total = (clone $query)->count();
        $limite = min(1000, max(1, $request->integer('limit', 100)));
        $offset = max(0, $request->integer('offset', 0));
        $orden = strtolower((string) $request->query('orderBy')) === 'desc' ? 'desc' : 'asc';
        $campoOrden = $campos[$request->query('sort')] ?? 'id';
        $items = $query->orderBy($campoOrden, $orden)->offset($offset)->limit($limite)->get()->map($mapper);
        $fields = array_values(array_filter(explode(',', (string) $request->query('fields'))));
        if ($fields) {
            $items = $items->map(fn (array $item) => array_intersect_key($item, array_flip($fields)));
        }

        return response()->json([$clave => $items->values()])
            ->header('X-Total-Count', (string) $total)
            ->header('X-Offset', (string) $offset)
            ->header('X-Limit', (string) $limite);
    }

    private function aplicarFiltro(Request $request, Builder $query, array $campos): void
    {
        $filtro = trim((string) $request->query('filter'));
        if ($filtro === '') {
            return;
        }
        abort_unless(preg_match("/^([A-Za-z][A-Za-z0-9]*)\\s*(=|!=|>=|<=|>|<|~)\\s*'([^']*)'$/", $filtro, $coincidencia) === 1, 400, 'Filtro OneRoster inválido.');
        [, $campo, $operador, $valor] = $coincidencia;
        abort_unless(isset($campos[$campo]), 400, 'Campo de filtro no permitido.');
        if ($operador === '~') {
            $query->where($campos[$campo], 'like', "%{$valor}%");
        } else {
            $query->where($campos[$campo], $operador === '=' ? '=' : $operador, $valor);
        }
    }

    private function academicSession(PeriodoAcademico $periodo): array
    {
        return array_filter([
            ...$this->base($periodo->sourced_id, $periodo->estado, $periodo->updated_at),
            'title' => $periodo->titulo,
            'type' => $periodo->tipo,
            'startDate' => $periodo->fecha_inicio?->format('Y-m-d'),
            'endDate' => $periodo->fecha_fin?->format('Y-m-d'),
            'parent' => $periodo->id_padre ? ['sourcedId' => PeriodoAcademico::whereKey($periodo->id_padre)->value('sourced_id')] : null,
        ], fn ($value) => $value !== null);
    }

    private function course(Curso $curso): array
    {
        return array_filter([
            ...$this->base($curso->sourced_id, $this->status($curso->estado), $curso->updated_at),
            'title' => $curso->titulo,
            'courseCode' => $curso->codigo,
            'grades' => $curso->nivel ? [$curso->nivel] : [],
            'org' => ['sourcedId' => $curso->institucion?->sourced_id],
        ], fn ($value) => $value !== null);
    }

    private function classRoom(Aula $aula): array
    {
        return array_filter([
            ...$this->base($aula->sourced_id, $aula->estado_interoperabilidad, $aula->updated_at),
            'title' => $aula->nombre,
            'classCode' => $aula->codigo,
            'classType' => $aula->tipo_clase,
            'grades' => $aula->nivel ? [$aula->nivel] : [],
            'course' => $aula->curso ? ['sourcedId' => $aula->curso->sourced_id] : null,
            'school' => ['sourcedId' => $aula->institucion?->sourced_id],
            'terms' => $aula->periodoAcademico ? [['sourcedId' => $aula->periodoAcademico->sourced_id]] : [],
        ], fn ($value) => $value !== null);
    }

    private function org(Institucion $institucion): array
    {
        return [
            ...$this->base($institucion->sourced_id, $institucion->estado_interoperabilidad, $institucion->updated_at),
            'name' => $institucion->nombre,
            'type' => 'school',
            'identifier' => $institucion->slug,
        ];
    }

    private function user(Usuario $usuario): array
    {
        $partes = preg_split('/\s+/', trim($usuario->nombre_completo), 2) ?: [];

        return array_filter([
            ...$this->base($usuario->sourced_id, $usuario->estado_interoperabilidad, $usuario->fecha_registro),
            'username' => $usuario->usuario,
            'enabledUser' => $usuario->estado_interoperabilidad === 'active',
            'givenName' => $partes[0] ?? $usuario->nombre_completo,
            'familyName' => $partes[1] ?? '',
            'role' => match ($usuario->rol) {
                'alumno' => 'student', 'docente' => 'teacher', 'tutor' => 'guardian', default => 'administrator',
            },
            'email' => $usuario->email,
            'grades' => $usuario->nivel ? [$usuario->nivel] : [],
            'orgs' => $usuario->institucion ? [['sourcedId' => $usuario->institucion->sourced_id]] : [],
        ], fn ($value) => $value !== null);
    }

    private function enrollment(MatriculaAula $matricula): array
    {
        return array_filter([
            ...$this->base($matricula->sourced_id, $matricula->estado, $matricula->updated_at),
            'role' => $matricula->rol,
            'primary' => (bool) $matricula->es_principal,
            'user' => ['sourcedId' => $matricula->usuario?->sourced_id],
            'class' => ['sourcedId' => $matricula->aula?->sourced_id],
            'school' => ['sourcedId' => $matricula->aula?->institucion?->sourced_id],
            'beginDate' => $matricula->fecha_inicio?->format('Y-m-d'),
            'endDate' => $matricula->fecha_fin?->format('Y-m-d'),
        ], fn ($value) => $value !== null);
    }

    private function base(?string $sourcedId, string $status, CarbonInterface|string|null $fecha): array
    {
        return [
            'sourcedId' => $sourcedId,
            'status' => $status,
            'dateLastModified' => $fecha instanceof CarbonInterface ? $fecha->utc()->toIso8601ZuluString() : now()->utc()->toIso8601ZuluString(),
        ];
    }

    private function status(string $estado): string
    {
        return $estado === 'archived' ? 'tobedeleted' : 'active';
    }
}
