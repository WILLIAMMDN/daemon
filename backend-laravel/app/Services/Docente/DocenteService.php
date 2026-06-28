<?php

namespace App\Services\Docente;

use App\Models\Insignia;
use App\Models\Usuario;
use App\Services\Archivo\ArchivoUrlService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DocenteService
{
    public function __construct(private readonly ArchivoUrlService $archivos) {}

    public function panel(): array
    {
        return [
            'alumnos' => Usuario::where('rol', 'alumno')->count(),
            'tokens_circulacion' => Usuario::where('rol', 'alumno')->sum('tokens'),
            'entregas_pendientes' => DB::table('entregas')->where('estado', 'pendiente')->count(),
            'canjes_pendientes' => DB::table('canjes')->where('estado', 'pendiente')->count(),
            'ranking' => $this->ranking(),
        ];
    }

    public function ranking(): Collection
    {
        return Usuario::where('rol', 'alumno')->orderByDesc('tokens')->limit(10)->get();
    }

    public function alumnos(): Collection
    {
        return Usuario::where('rol', 'alumno')->orderBy('nombre_completo')->get();
    }

    public function asignarTokens(Usuario $docente, array $datos): Usuario
    {
        return DB::transaction(function () use ($docente, $datos) {
            $alumno = Usuario::where('rol', 'alumno')->lockForUpdate()->findOrFail($datos['id_alumno']);

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

    public function historialTokens(): Collection
    {
        return DB::table('historial_movimientos as h')
            ->leftJoin('usuarios as d', 'd.id', '=', 'h.id_docente')
            ->leftJoin('usuarios as a', 'a.id', '=', 'h.id_alumno')
            ->select('h.*', DB::raw("coalesce(d.nombre_completo, 'Sistema o docente eliminado') as docente"), DB::raw("coalesce(a.nombre_completo, 'Alumno eliminado') as alumno"))
            ->orderByDesc('h.fecha')
            ->limit(500)
            ->get();
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

    public function asignarInsignia(array $datos): void
    {
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
}
