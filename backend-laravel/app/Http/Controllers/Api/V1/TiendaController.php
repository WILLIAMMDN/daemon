<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Tienda\PremioStoreRequest;
use App\Http\Requests\Api\V1\Tienda\PremioUpdateRequest;
use App\Models\Canje;
use App\Models\Premio;
use App\Services\Academico\AcademicScopeService;
use App\Services\Archivo\ArchivoUrlService;
use App\Services\Tienda\CanjeService;
use App\Services\Tienda\PremioService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TiendaController extends Controller
{
    public function __construct(
        private readonly CanjeService $canjesService,
        private readonly PremioService $premiosService,
        private readonly ArchivoUrlService $archivos,
        private readonly AcademicScopeService $alcance,
    ) {}

    public function index(Request $request)
    {
        return [
            'saldo' => $request->user()->tokens,
            'premios' => Premio::where('stock', '>', 0)
                ->whereIn('categoria', ['GENERAL', $request->user()->nivel])
                ->orderBy('precio')
                ->get()
                ->map(fn (Premio $premio) => $this->premioConUrls($premio)),
        ];
    }

    public function canjear(Request $request, Premio $premio)
    {
        $usuario = $request->user();
        if ($premio->categoria !== 'GENERAL' && $premio->categoria !== $usuario->nivel) {
            return response()->json(['message' => 'No puedes canjear premios de otra categoría o nivel.'], 422);
        }

        return $this->canjesService->canjear($usuario, $premio);
    }

    public function canjes(Request $request)
    {
        return DB::table('canjes as c')->join('premios as p', 'p.id', '=', 'c.id_premio')->leftJoin('premios_stock_digital as psd', 'psd.id_canje', '=', 'c.id')
            ->where('c.id_alumno', $request->user()->id)->select('c.*', 'p.nombre', 'p.descripcion', 'p.imagen', 'p.tipo_entrega', 'psd.dato_publico', 'psd.dato_privado')->orderByDesc('c.fecha')->get()
            ->map(fn ($canje) => $this->conImagen($canje));
    }

    public function administrar(Request $request)
    {
        $premios = Premio::query();

        if ($busqueda = trim((string) $request->query('q', ''))) {
            $busquedaLower = mb_strtolower($busqueda);
            $premios->where(function ($query) use ($busquedaLower) {
                $query->whereRaw('LOWER(nombre) LIKE ?', ["%{$busquedaLower}%"])
                    ->orWhereRaw('LOWER(descripcion) LIKE ?', ["%{$busquedaLower}%"]);
            });
        }

        if ($categoria = $request->query('categoria')) {
            $categorias = is_array($categoria) ? $categoria : explode(',', (string) $categoria);
            $categorias = array_values(array_filter(array_map('trim', $categorias)));
            if ($categorias) {
                $premios->whereIn('categoria', $categorias);
            }
        }

        if ($tipo = $request->query('tipo_entrega')) {
            $premios->where('tipo_entrega', $tipo);
        }

        if ($request->query('solo_con_stock') === '1') {
            $premios->where('stock', '>', 0);
        }

        $premios = $premios->orderByDesc('id')->get()->map(fn (Premio $premio) => $this->premioConUrls($premio));

        $canjes = DB::table('canjes as c')
            ->join('usuarios as u', 'u.id', '=', 'c.id_alumno')
            ->join('premios as p', 'p.id', '=', 'c.id_premio')
            ->select('c.*', 'u.nombre_completo as alumno', 'u.id_aula', 'p.nombre as premio');

        $this->alcance->aplicarAlumnosQuery($canjes, $request->user(), 'u.id_aula');

        if ($estado = $request->query('estado')) {
            $canjes->where('c.estado', $estado);
        }

        if ($alumno = $request->query('id_alumno')) {
            $canjes->where('c.id_alumno', (int) $alumno);
        }

        return [
            'premios' => $premios,
            'canjes' => $canjes->orderByDesc('c.fecha')->get(),
            'filtros' => [
                'q' => $request->query('q'),
                'categoria' => $request->query('categoria'),
                'tipo_entrega' => $request->query('tipo_entrega'),
                'solo_con_stock' => $request->query('solo_con_stock'),
                'estado' => $request->query('estado'),
                'id_alumno' => $request->query('id_alumno'),
            ],
        ];
    }

    public function store(PremioStoreRequest $request)
    {
        return response()->json($this->premiosService->crear($request->validated()), 201);
    }

    public function update(PremioUpdateRequest $request, Premio $premio)
    {
        return $this->premiosService->actualizar($premio, $request->validated());
    }

    public function destroy(Premio $premio)
    {
        $this->premiosService->eliminar($premio);

        return response()->noContent();
    }

    public function entregar(Request $request, Canje $canje)
    {
        $this->alcance->alumnoGestionable($request->user(), (int) $canje->id_alumno);
        $canje->update(['estado' => 'entregado']);

        return $canje;
    }

    private function premioConUrls(Premio $premio): array
    {
        return [
            ...$premio->toArray(),
            'imagen' => $this->archivos->url($premio->imagen),
        ];
    }

    private function conImagen(object $registro): object
    {
        $registro->imagen = $this->archivos->url($registro->imagen);

        return $registro;
    }
}
