<?php

namespace App\Services\Docente;

use App\Models\Insignia;
use App\Models\Usuario;
use App\Services\Archivo\ArchivoUrlService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DocenteService
{
    public function __construct(private readonly ArchivoUrlService $archivos) {}

    public function panel(?Usuario $docente = null): array
    {
        $alumnos = $this->alumnosQuery($docente);

        return [
            'alumnos' => (clone $alumnos)->count(),
            'tokens_circulacion' => (clone $alumnos)->sum('tokens'),
            'entregas_pendientes' => $this->conteoPendientes('entregas', $docente),
            'canjes_pendientes' => $this->conteoPendientes('canjes', $docente),
            'ranking' => $this->ranking($docente),
        ];
    }

    public function ranking(?Usuario $docente = null): Collection
    {
        return $this->alumnosQuery($docente)->orderByDesc('tokens')->limit(10)->get();
    }

    public function alumnos(?Usuario $docente = null): Collection
    {
        return $this->alumnosQuery($docente)->orderBy('nombre_completo')->get();
    }

    public function asignarTokens(Usuario $docente, array $datos): Usuario
    {
        return DB::transaction(function () use ($docente, $datos) {
            $alumno = $this->alumnoGestionable($docente, (int) $datos['id_alumno'], true);

            abort_if($alumno->tokens + $datos['cantidad'] < 0, 422, 'El saldo no puede quedar negativo.');

            $alumno->increment('tokens', $datos['cantidad']);

            DB::table('historial_movimientos')->insert([
                'id_docente' => $docente->id,
                'id_alumno' => $alumno->id,
                'cantidad' => $datos['cantidad'],
                'id_operador' => $docente->id,
                'motivo' => $datos['motivo'] ?? 'Ajuste manual',
            ]);

            return $alumno->fresh();
        });
    }

    public function historialTokens(?Usuario $docente = null): Collection
    {
        $query = DB::table('historial_movimientos as h')
            ->leftJoin('usuarios as d', 'd.id', '=', 'h.id_docente')
            ->leftJoin('usuarios as a', 'a.id', '=', 'h.id_alumno')
            ->select('h.*', DB::raw("coalesce(d.nombre_completo, 'Sistema o docente eliminado') as docente"), DB::raw("coalesce(a.nombre_completo, 'Alumno eliminado') as alumno"));

        if ($this->docenteConAula($docente)) {
            $query->where('a.id_aula', $docente->id_aula);
        }

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
        $this->alumnoGestionable($docente, (int) $datos['id_alumno']);

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
        $query = Usuario::query()->where('rol', 'alumno');

        if ($this->docenteConAula($docente)) {
            $query->where('id_aula', $docente->id_aula);
        }

        return $query;
    }

    private function alumnoGestionable(Usuario $docente, int $idAlumno, bool $bloquear = false): Usuario
    {
        $query = $this->alumnosQuery($docente);

        if ($bloquear) {
            $query->lockForUpdate();
        }

        return $query->findOrFail($idAlumno);
    }

    private function conteoPendientes(string $tabla, ?Usuario $docente = null): int
    {
        $query = DB::table($tabla)->where("{$tabla}.estado", 'pendiente');

        if ($this->docenteConAula($docente)) {
            $query
                ->join('usuarios as alumno_scope', 'alumno_scope.id', '=', "{$tabla}.id_alumno")
                ->where('alumno_scope.id_aula', $docente->id_aula);
        }

        return $query->count();
    }

    private function docenteConAula(?Usuario $docente): bool
    {
        return $docente?->rol === 'docente' && filled($docente->id_aula);
    }
}
