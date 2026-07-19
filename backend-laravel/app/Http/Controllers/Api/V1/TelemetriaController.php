<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Analitica\ProductoAnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TelemetriaController extends Controller
{
    public function __construct(private readonly ProductoAnalyticsService $analytics) {}

    public function store(Request $request)
    {
        $datos = $request->validate([
            'nombre' => ['required', Rule::in(ProductoAnalyticsService::EVENTOS_PERMITIDOS)],
            'sesion_id' => ['nullable', 'string', 'max:100'],
            'propiedades' => ['nullable', 'array', 'max:12'],
        ]);
        $this->analytics->registrar($request->user(), $datos);

        return response()->noContent();
    }
}
