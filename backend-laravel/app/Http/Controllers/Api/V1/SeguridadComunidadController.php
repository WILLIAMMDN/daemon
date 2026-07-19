<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ReporteContenido;
use App\Models\Usuario;
use App\Services\Seguridad\ModeracionService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SeguridadComunidadController extends Controller
{
    public function __construct(private readonly ModeracionService $moderacion) {}

    public function reportar(Request $request)
    {
        $datos = $request->validate([
            'id_usuario_reportado' => ['nullable', 'integer', 'exists:usuarios,id'],
            'tipo_contenido' => ['required', Rule::in(['usuario', 'chat_live', 'cuento', 'perfil', 'otro'])],
            'id_contenido' => ['nullable', 'string', 'max:100'],
            'categoria' => ['required', Rule::in(['acoso', 'amenaza', 'contenido_sexual', 'autolesion', 'spam', 'suplantacion', 'otro'])],
            'descripcion' => ['nullable', 'string', 'max:1000'],
        ]);

        return response()->json($this->moderacion->reportar($request->user(), $datos), 201);
    }

    public function bloquear(Request $request, Usuario $usuario)
    {
        $this->moderacion->bloquear($request->user(), $usuario);

        return response()->noContent();
    }

    public function desbloquear(Request $request, Usuario $usuario)
    {
        $this->moderacion->desbloquear($request->user(), $usuario);

        return response()->noContent();
    }

    public function reportes(Request $request)
    {
        return ReporteContenido::query()
            ->when($request->query('estado'), fn ($query, $estado) => $query->where('estado', $estado))
            ->orderByRaw("case when severidad = 'high' then 0 else 1 end")
            ->orderBy('created_at')
            ->paginate(min(100, max(1, $request->integer('per_page', 25))));
    }

    public function resolver(Request $request, ReporteContenido $reporte)
    {
        $datos = $request->validate([
            'estado' => ['required', Rule::in(['reviewing', 'resolved', 'dismissed'])],
            'resolucion' => ['nullable', 'string', 'max:2000'],
        ]);

        return $this->moderacion->resolver($request->user(), $reporte, $datos);
    }
}
