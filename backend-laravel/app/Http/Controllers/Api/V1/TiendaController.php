<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Tienda\PremioStoreRequest;
use App\Http\Requests\Api\V1\Tienda\PremioUpdateRequest;
use App\Models\Canje;
use App\Models\Premio;
use App\Services\Tienda\CanjeService;
use App\Services\Tienda\PremioService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TiendaController extends Controller
{
    public function __construct(
        private readonly CanjeService $canjesService,
        private readonly PremioService $premiosService,
    ) {}

    public function index(Request $request)
    {
        return ['saldo' => $request->user()->tokens, 'premios' => Premio::where('stock', '>', 0)->whereIn('categoria', ['GENERAL', $request->user()->nivel])->orderBy('precio')->get()];
    }

    public function canjear(Request $request, Premio $premio)
    {
        return $this->canjesService->canjear($request->user(), $premio);
    }

    public function canjes(Request $request)
    {
        return DB::table('canjes as c')->join('premios as p', 'p.id', '=', 'c.id_premio')->leftJoin('premios_stock_digital as psd', 'psd.id_canje', '=', 'c.id')
            ->where('c.id_alumno', $request->user()->id)->select('c.*', 'p.nombre', 'p.descripcion', 'p.imagen', 'p.tipo_entrega', 'psd.dato_publico', 'psd.dato_privado')->orderByDesc('c.fecha')->get();
    }

    public function administrar()
    {
        return ['premios' => Premio::orderByDesc('id')->get(), 'canjes' => DB::table('canjes as c')->join('usuarios as u', 'u.id', '=', 'c.id_alumno')->join('premios as p', 'p.id', '=', 'c.id_premio')->select('c.*', 'u.nombre_completo as alumno', 'p.nombre as premio')->orderByDesc('c.fecha')->get()];
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

    public function entregar(Canje $canje)
    {
        $canje->update(['estado' => 'entregado']);

        return $canje;
    }
}
