<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Mision\BulkDestroyMisionRequest;
use App\Http\Requests\Api\V1\Mision\EntregarMisionRequest;
use App\Http\Requests\Api\V1\Mision\MisionStoreRequest;
use App\Http\Requests\Api\V1\Mision\MisionUpdateRequest;
use App\Http\Requests\Api\V1\Mision\RevisarEntregaRequest;
use App\Models\Entrega;
use App\Models\Mision;
use App\Services\Academico\AcademicScopeService;
use App\Services\Archivo\ArchivoService;
use App\Services\Gamificacion\GamificacionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MisionController extends Controller
{
    public function __construct(
        private readonly ArchivoService $archivos,
        private readonly AcademicScopeService $alcance,
        private readonly GamificacionService $gamificacion,
    ) {}

    public function index(Request $request)
    {
        $query = Mision::query()->orderByDesc('id');
        if ($request->user()->rol === 'alumno') {
            $query->where('estado', 'activo')->whereIn('nivel_requerido', ['TODOS', $request->user()->nivel]);
        }
        $entregas = Entrega::where('id_alumno', $request->user()->id)->get()->keyBy('id_desafio');

        return $query->get()->map(fn ($mision) => [...$mision->toArray(), 'entrega' => $this->entregaConUrl($entregas->get($mision->id))]);
    }

    public function show(Request $request, Mision $mision)
    {
        return [
            'mision' => $mision,
            'entrega' => $this->entregaConUrl(
                Entrega::where('id_desafio', $mision->id)->where('id_alumno', $request->user()->id)->latest('id')->first()
            ),
        ];
    }

    public function store(MisionStoreRequest $request)
    {
        return response()->json(Mision::create($request->validated()), 201);
    }

    public function update(MisionUpdateRequest $request, Mision $mision)
    {
        $mision->update($request->validated());

        return $mision->fresh();
    }

    public function destroy(Mision $mision)
    {
        DB::transaction(function () use ($mision) {
            Entrega::where('id_desafio', $mision->id)->delete();
            $mision->delete();
        });

        return response()->noContent();
    }

    public function bulkDestroy(BulkDestroyMisionRequest $request)
    {
        $ids = array_values(array_unique(array_map('intval', $request->validated()['ids'])));
        $eliminadas = 0;
        $entregasEliminadas = 0;

        DB::transaction(function () use ($ids, &$eliminadas, &$entregasEliminadas) {
            foreach (Mision::whereIn('id', $ids)->get() as $mision) {
                $entregasEliminadas += Entrega::where('id_desafio', $mision->id)->delete();
                $mision->delete();
                $eliminadas++;
            }
        });

        return [
            'eliminadas' => $eliminadas,
            'entregas_eliminadas' => $entregasEliminadas,
            'ids' => $ids,
        ];
    }

    public function entregar(EntregarMisionRequest $request, Mision $mision)
    {
        $evidencia = $request->input('texto', 'Entrega registrada');
        if ($request->hasFile('archivo')) {
            $evidencia = $this->archivos->guardarRuta($request->user(), $request->file('archivo'), $this->archivos->directorioEntrega($request->user()));
        }

        $entregaExistente = Entrega::where('id_desafio', $mision->id)
            ->where('id_alumno', $request->user()->id)
            ->whereIn('estado', ['pendiente', 'aprobado'])
            ->first();

        if ($entregaExistente) {
            return response()->json(['message' => 'Ya tienes una entrega en revisión o aprobada para esta misión.'], 422);
        }

        return response()->json($this->entregaConUrl(Entrega::create(['id_desafio' => $mision->id, 'id_alumno' => $request->user()->id, 'archivo_url' => $evidencia, 'estado' => 'pendiente'])), 201);
    }

    public function entregas(Request $request)
    {
        $query = DB::table('entregas as e')
            ->join('desafios as d', 'd.id', '=', 'e.id_desafio')
            ->join('usuarios as u', 'u.id', '=', 'e.id_alumno')
            ->select('e.*', 'd.titulo as mision', 'd.recompensa', 'd.es_mision_nivel', 'u.nombre_completo as alumno', 'u.nivel', 'u.id_aula');

        $this->alcance->aplicarAlumnosQuery($query, $request->user(), 'u.id_aula');

        return $query->orderByDesc('e.fecha_entrega')->get()
            ->map(fn ($entrega) => $this->entregaConUrl($entrega));
    }

    public function revisar(RevisarEntregaRequest $request, Entrega $entrega)
    {
        $datos = $request->validated();

        return DB::transaction(function () use ($request, $entrega, $datos) {
            $yaAprobada = $entrega->estado === 'aprobado';
            $mision = Mision::findOrFail($entrega->id_desafio);
            $puntos = $datos['calificacion'] ?? $mision->recompensa;
            $alumno = $this->alcance->alumnoGestionable($request->user(), (int) $entrega->id_alumno, true);

            $entrega->update([...$datos, 'calificacion' => $puntos]);
            if ($datos['estado'] === 'aprobado' && ! $yaAprobada) {
                $this->gamificacion->otorgarRecompensa($alumno, $puntos);
                if ($mision->es_mision_nivel) {
                    $alumno->increment('mision_actual');
                }
                DB::table('historial_movimientos')->insert(['id_docente' => $request->user()->id, 'id_alumno' => $alumno->id, 'cantidad' => $puntos, 'id_operador' => $request->user()->id, 'motivo' => "Mision aprobada: {$mision->titulo}"]);
            }

            return $this->entregaConUrl($entrega->fresh());
        });
    }

    private function entregaConUrl($entrega)
    {
        if (! $entrega || ! isset($entrega->archivo_url) || ! is_string($entrega->archivo_url)) {
            return $entrega;
        }

        if (str_starts_with($entrega->archivo_url, 'uploads/')) {
            $entrega->archivo_url = $this->archivos->url($entrega->archivo_url);
        }

        return $entrega;
    }
}
