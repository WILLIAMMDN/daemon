<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Docente\AsignarInsigniaRequest;
use App\Http\Requests\Api\V1\Docente\AsignarTokensRequest;
use App\Http\Requests\Api\V1\Docente\InsigniaStoreRequest;
use App\Http\Requests\Api\V1\Docente\InsigniaUpdateRequest;
use App\Http\Resources\Api\V1\UsuarioResource;
use App\Models\Insignia;
use App\Services\Archivo\ArchivoService;
use App\Services\Docente\DocenteService;

class DocenteController extends Controller
{
    public function __construct(
        private readonly DocenteService $docente,
        private readonly ArchivoService $archivos,
    ) {}

    public function panel()
    {
        $panel = $this->docente->panel();
        $panel['ranking'] = UsuarioResource::collection($panel['ranking']);

        return $panel;
    }

    public function alumnos()
    {
        return UsuarioResource::collection($this->docente->alumnos());
    }

    public function asignarTokens(AsignarTokensRequest $request)
    {
        return UsuarioResource::make($this->docente->asignarTokens($request->user(), $request->validated()));
    }

    public function historialTokens()
    {
        return $this->docente->historialTokens();
    }

    public function insignias()
    {
        return $this->docente->insignias();
    }

    public function store(InsigniaStoreRequest $request)
    {
        $datos = $request->validated();
        $archivo = $request->file('archivo');
        unset($datos['archivo']);

        $insignia = $this->docente->crearInsignia([
            ...$datos,
            'imagen' => $datos['imagen'] ?? 'uploads/insignias/pendiente.png',
        ]);

        if ($archivo) {
            $insignia = $this->docente->actualizarInsignia($insignia, [
                'imagen' => $this->archivos->guardarRuta($request->user(), $archivo, "uploads/insignias/{$insignia->id}"),
            ]);
        }

        return response()->json($this->docente->insigniaConUrl($insignia), 201);
    }

    public function update(InsigniaUpdateRequest $request, Insignia $insignia)
    {
        $datos = $request->validated();
        $archivo = $request->file('archivo');
        unset($datos['archivo']);

        if ($archivo) {
            $datos['imagen'] = $this->archivos->guardarRuta($request->user(), $archivo, "uploads/insignias/{$insignia->id}");
        }

        return $this->docente->insigniaConUrl($this->docente->actualizarInsignia($insignia, $datos));
    }

    public function destroy(Insignia $insignia)
    {
        $this->docente->eliminarInsignia($insignia);

        return response()->noContent();
    }

    public function asignarInsignia(AsignarInsigniaRequest $request)
    {
        $this->docente->asignarInsignia($request->validated());

        return ['ok' => true];
    }
}
