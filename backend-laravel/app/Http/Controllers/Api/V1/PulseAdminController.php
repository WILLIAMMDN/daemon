<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Pulse\LogroPulseStoreRequest;
use App\Http\Requests\Api\V1\Pulse\LogroPulseUpdateRequest;
use App\Http\Requests\Api\V1\Pulse\PoliticaPulseStoreRequest;
use App\Http\Requests\Api\V1\Pulse\PoliticaPulseUpdateRequest;
use App\Models\Insignia;
use App\Models\PoliticaRecompensaPulse;

class PulseAdminController extends Controller
{
    public function politicas(): array
    {
        return ['data' => PoliticaRecompensaPulse::orderBy('tipo_evento')->orderBy('clave')->get()];
    }

    public function crearPolitica(PoliticaPulseStoreRequest $request)
    {
        return response()->json(PoliticaRecompensaPulse::create([
            ...$request->validated(),
            'creada_por' => $request->user()->id,
            'actualizada_por' => $request->user()->id,
        ]), 201);
    }

    public function actualizarPolitica(PoliticaPulseUpdateRequest $request, PoliticaRecompensaPulse $politica)
    {
        $politica->fill([...$request->validated(), 'actualizada_por' => $request->user()->id])->save();

        return $politica->fresh();
    }

    public function logros(): array
    {
        return ['data' => Insignia::whereNotNull('tipo_criterio')->orderBy('clave_pulse')->get()];
    }

    public function crearLogro(LogroPulseStoreRequest $request)
    {
        return response()->json(Insignia::create($request->validated()), 201);
    }

    public function actualizarLogro(LogroPulseUpdateRequest $request, Insignia $logro)
    {
        abort_if($logro->tipo_criterio === null, 409, 'La insignia no es una definición automática Pulse.');
        $logro->fill($request->validated())->save();

        return $logro->fresh();
    }
}
