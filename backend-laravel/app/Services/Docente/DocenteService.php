<?php

namespace App\Services\Docente;

use App\Models\Aula;
use App\Models\Insignia;
use App\Models\Institucion;
use App\Models\MatriculaAula;
use App\Models\Usuario;
use App\Services\Academico\AcademicScopeService;
use App\Services\Archivo\ArchivoUrlService;
use App\Services\Economia\EconomiaService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DocenteService
{
    public function __construct(
        private readonly ArchivoUrlService $archivos,
        private readonly AcademicScopeService $alcance,
        private readonly EconomiaService $economia,
    ) {}

    public function panel(?Usuario $docente = null): array
    {
        $alumnos = $this->alumnosBaseQuery($docente);
        $metricas = DB::query()
            ->selectSub((clone $alumnos)->selectRaw('count(*)'), 'alumnos')
            ->selectSub((clone $alumnos)->selectRaw('coalesce(sum(tokens), 0)'), 'tokens_circulacion')
            ->selectSub($this->pendientesQuery('entregas', $docente)->selectRaw('count(*)'), 'entregas_pendientes')
            ->selectSub($this->pendientesQuery('canjes', $docente)->selectRaw('count(*)'), 'canjes_pendientes')
            ->first();

        return [
            'alumnos' => (int) ($metricas->alumnos ?? 0),
            'tokens_circulacion' => (int) ($metricas->tokens_circulacion ?? 0),
            'entregas_pendientes' => (int) ($metricas->entregas_pendientes ?? 0),
            'canjes_pendientes' => (int) ($metricas->canjes_pendientes ?? 0),
            'ranking' => $this->ranking($docente),
            'alcance' => $this->alcance->resumen($docente),
        ];
    }

    public function ranking(?Usuario $docente = null): Collection
    {
        return $this->alumnosQuery($docente)->orderByDesc('experiencia')->limit(10)->get();
    }

    public function alumnos(?Usuario $docente = null): Collection
    {
        return $this->alumnosQuery($docente)->orderBy('nombre_completo')->get();
    }

    public function docentes(Usuario $usuario): Collection
    {
        if ($usuario->rol !== 'admin') {
            return collect([$usuario->load('aula.institucion')]);
        }

        return Usuario::query()
            ->with('aula.institucion')
            ->where('rol', 'docente')
            ->orderBy('nombre_completo')
            ->get();
    }

    public function aulas(Usuario $usuario): Collection
    {
        $query = Aula::query()
            ->with('institucion')
            ->withCount([
                'usuarios as alumnos_count' => fn ($query) => $query->where('rol', 'alumno'),
                'usuarios as docentes_count' => fn ($query) => $query->whereIn('rol', ['docente', 'admin']),
            ])
            ->orderBy('nombre');

        if ($usuario->rol === 'docente') {
            if (blank($usuario->id_aula)) {
                return collect();
            }

            $query->whereKey($usuario->id_aula);
        }

        return $query->get()->map(fn (Aula $aula) => [
            ...$this->alcance->aulaPayload($aula),
            'institucion' => $aula->institucion ? [
                'id' => $aula->institucion->id,
                'nombre' => $aula->institucion->nombre,
                'slug' => $aula->institucion->slug,
            ] : null,
            'alumnos_count' => (int) $aula->alumnos_count,
            'docentes_count' => (int) $aula->docentes_count,
        ]);
    }

    public function crearAula(array $datos): Aula
    {
        $datos['id_institucion'] ??= $this->institucionPorDefecto()->id;

        if (blank($datos['codigo'] ?? null)) {
            unset($datos['codigo']);
        }

        return Aula::create($datos)->fresh(['institucion']);
    }

    public function aulaGestionable(Usuario $docente, Aula $aula): Aula
    {
        if ($docente->rol === 'admin') {
            return $aula;
        }

        abort_unless(
            $docente->rol === 'docente' && (int) $docente->id_aula === (int) $aula->id,
            403,
            'No puedes operar sobre aulas fuera de tu alcance.'
        );

        return $aula;
    }

    public function actualizarAula(Aula $aula, array $datos): Aula
    {
        if (array_key_exists('codigo', $datos) && blank($datos['codigo'])) {
            unset($datos['codigo']);
        }

        $aula->fill($datos)->save();

        return $aula->fresh(['institucion']);
    }

    public function eliminarAula(Aula $aula): void
    {
        DB::transaction(function () use ($aula) {
            $usuariosAsignados = $aula->usuarios()->count();

            abort_if(
                $usuariosAsignados > 0,
                422,
                "No se puede eliminar el aula porque tiene {$usuariosAsignados} usuario(s) asignado(s)."
            );

            $aula->delete();
        });
    }

    public function asignarAulaUsuario(Usuario $usuario, ?int $idAula): Usuario
    {
        abort_unless(in_array($usuario->rol, ['alumno', 'docente'], true), 422, 'Solo se pueden asignar alumnos o docentes a aulas.');

        if (! $idAula) {
            MatriculaAula::where('id_usuario', $usuario->id)->where('es_principal', true)->update([
                'es_principal' => false,
                'estado' => 'tobedeleted',
            ]);
            $usuario->forceFill([
                'id_aula' => null,
                'id_institucion' => null,
            ])->save();

            return $usuario->fresh(['aula.institucion']);
        }

        $aula = Aula::findOrFail($idAula);
        $rolOneRoster = $usuario->rol === 'alumno' ? 'student' : 'teacher';
        MatriculaAula::where('id_usuario', $usuario->id)->update(['es_principal' => false]);
        $matricula = MatriculaAula::firstOrNew(['id_aula' => $aula->id, 'id_usuario' => $usuario->id, 'rol' => $rolOneRoster]);
        $matricula->sourced_id ??= (string) Str::uuid();
        $matricula->fill(['es_principal' => true, 'estado' => 'active'])->save();
        $usuario->forceFill([
            'id_aula' => $aula->id,
            'id_institucion' => $aula->id_institucion,
        ])->save();

        return $usuario->fresh(['aula.institucion']);
    }

    public function asignarTokens(Usuario $docente, array $datos): Usuario
    {
        return DB::transaction(function () use ($docente, $datos) {
            $alumno = $this->alcance->alumnoGestionable($docente, (int) $datos['id_alumno'], true);

            abort_if($alumno->tokens + $datos['cantidad'] < 0, 422, 'El saldo no puede quedar negativo.');

            $movimientoLegacyId = DB::table('historial_movimientos')->insertGetId([
                'id_docente' => $docente->id,
                'id_alumno' => $alumno->id,
                'cantidad' => $datos['cantidad'],
                'id_operador' => $docente->id,
                'motivo' => $datos['motivo'] ?? 'Ajuste manual',
            ]);

            return $this->economia->ajustarDaemons(
                $alumno,
                (int) $datos['cantidad'],
                'ajuste_manual',
                $movimientoLegacyId,
                $docente,
                "ajuste-manual:{$movimientoLegacyId}",
                $datos['motivo'] ?? 'Ajuste manual',
            );
        });
    }

    public function historialTokens(?Usuario $docente = null): Collection
    {
        $query = DB::table('historial_movimientos as h')
            ->leftJoin('usuarios as d', 'd.id', '=', 'h.id_docente')
            ->leftJoin('usuarios as a', 'a.id', '=', 'h.id_alumno')
            ->select('h.*', DB::raw("coalesce(d.nombre_completo, 'Sistema o docente eliminado') as docente"), DB::raw("coalesce(a.nombre_completo, 'Alumno eliminado') as alumno"));

        $this->alcance->aplicarAlumnosQuery($query, $docente, 'a.id_aula');

        return $query->orderByDesc('h.fecha')->limit(500)->get();
    }

    public function insignias(): Collection
    {
        return Insignia::orderByDesc('id')
            ->get()
            ->map(fn (Insignia $insignia) => $this->insigniaConUrl($insignia));
    }

    public function crearInsignia(array $datos): Insignia
    {
        return Insignia::create($datos);
    }

    public function actualizarInsignia(Insignia $insignia, array $datos): Insignia
    {
        $insignia->update($datos);

        return $insignia->fresh();
    }

    public function eliminarInsignia(Insignia $insignia): void
    {
        DB::transaction(function () use ($insignia) {
            DB::table('insignias_otorgadas')->where('id_insignia', $insignia->id)->delete();
            $insignia->delete();
        });
    }

    public function asignarInsignia(Usuario $docente, array $datos): void
    {
        $this->alcance->alumnoGestionable($docente, (int) $datos['id_alumno']);

        $clave = [
            'id_alumno' => $datos['id_alumno'],
            'id_insignia' => $datos['id_insignia'],
        ];

        if ($datos['asignar'] ?? true) {
            DB::table('insignias_otorgadas')->updateOrInsert($clave, ['fecha' => now()]);

            return;
        }

        DB::table('insignias_otorgadas')->where($clave)->delete();
    }

    public function insigniaConUrl(Insignia $insignia): Insignia
    {
        $insignia->imagen = $this->archivos->url($insignia->imagen);

        return $insignia;
    }

    private function alumnosQuery(?Usuario $docente = null): Builder
    {
        $query = Usuario::query()->with('aula.institucion')->where('rol', 'alumno');

        return $this->alcance->aplicarAlumnosEloquent($query, $docente);
    }

    private function alumnosBaseQuery(?Usuario $docente = null): \Illuminate\Database\Query\Builder
    {
        $query = DB::table('usuarios')->where('rol', 'alumno');

        return $this->alcance->aplicarAlumnosQuery($query, $docente);
    }

    private function conteoPendientes(string $tabla, ?Usuario $docente = null): int
    {
        return $this->pendientesQuery($tabla, $docente)->count();
    }

    private function pendientesQuery(string $tabla, ?Usuario $docente = null): \Illuminate\Database\Query\Builder
    {
        $query = DB::table($tabla)->where("{$tabla}.estado", 'pendiente');

        if ($docente?->rol === 'docente') {
            $query->join('usuarios as alumno_scope', 'alumno_scope.id', '=', "{$tabla}.id_alumno");
            $this->alcance->aplicarAlumnosQuery($query, $docente, 'alumno_scope.id_aula');
        }

        return $query;
    }

    public function alcance(Usuario $usuario): array
    {
        return $this->alcance->resumen($usuario);
    }

    private function institucionPorDefecto(): Institucion
    {
        return Institucion::firstOrCreate(
            ['slug' => 'daemon-general'],
            ['nombre' => 'DAEMON']
        );
    }
}
