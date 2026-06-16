<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CertificadoController extends Controller
{
    public function show(Request $request, ?Usuario $usuario = null)
    {
        $usuario ??= $request->user();

        return ['usuario' => $usuario, 'insignias' => DB::table('insignias_otorgadas as io')->join('insignias as i', 'i.id', '=', 'io.id_insignia')->where('io.id_alumno', $usuario->id)->select('i.*', 'io.fecha')->get(), 'emitido_en' => now()->toIso8601String()];
    }
}
