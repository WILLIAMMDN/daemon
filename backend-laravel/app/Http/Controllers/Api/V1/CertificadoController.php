<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use App\Services\Archivo\ArchivoUrlService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CertificadoController extends Controller
{
    public function __construct(private readonly ArchivoUrlService $archivos) {}

    public function show(Request $request, ?Usuario $usuario = null)
    {
        $usuario ??= $request->user();

        $usuario->avatar = $this->archivos->url($usuario->avatar);
        $usuario->fondo = $this->archivos->url($usuario->fondo);
        $usuario->heroe = $this->archivos->url($usuario->heroe);

        return [
            'usuario' => $usuario,
            'insignias' => DB::table('insignias_otorgadas as io')->join('insignias as i', 'i.id', '=', 'io.id_insignia')->where('io.id_alumno', $usuario->id)->select('i.*', 'io.fecha')->get()
                ->map(function ($insignia) {
                    $insignia->imagen = $this->archivos->url($insignia->imagen);

                    return $insignia;
                }),
            'emitido_en' => now()->toIso8601String(),
        ];
    }
}
