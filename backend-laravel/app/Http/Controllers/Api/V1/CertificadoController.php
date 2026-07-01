<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use App\Services\Academico\AcademicScopeService;
use App\Services\Archivo\ArchivoUrlService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CertificadoController extends Controller
{
    public function __construct(
        private readonly ArchivoUrlService $archivos,
        private readonly AcademicScopeService $alcance,
    ) {}

    public function show(Request $request, ?Usuario $usuario = null)
    {
        $actor = $request->user();
        $usuario ??= $actor;

        if ((int) $usuario->id !== (int) $actor->id) {
            abort_unless(in_array($actor->rol, ['docente', 'admin'], true), 403, 'No puedes ver este carnet.');
            abort_unless($usuario->rol === 'alumno', 403, 'Solo se pueden emitir carnets de alumnos desde esta vista.');
            $this->alcance->alumnoGestionable($actor, (int) $usuario->id);
        }

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
