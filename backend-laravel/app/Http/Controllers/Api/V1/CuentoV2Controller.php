<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Cuento\ComandoCuentoV2Request;
use App\Http\Requests\Api\V1\Cuento\AsistirCuentoV2Request;
use App\Http\Requests\Api\V1\Cuento\ComentarCuentoV2Request;
use App\Http\Requests\Api\V1\Cuento\EditarComentarioCuentoV2Request;
use App\Http\Requests\Api\V1\Cuento\PublicarCuentoV2AdminRequest;
use App\Http\Requests\Api\V1\Cuento\ReaccionarCuentoV2Request;
use App\Http\Requests\Api\V1\Cuento\GestionarActivoCuentoV2Request;
use App\Http\Requests\Api\V1\Cuento\LimpiarActivosCuentoV2Request;
use App\Http\Requests\Api\V1\Cuento\SubirActivoCuentoV2Request;
use App\Services\Cuento\CuentoV2Service;
use App\Services\Cuento\AsistenteCuentoService;
use App\Services\Cuento\ActivosCuentoService;
use App\Exceptions\CuentoV2Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class CuentoV2Controller extends Controller
{
    public function __construct(
        private readonly CuentoV2Service $cuentos,
        private readonly AsistenteCuentoService $asistente,
        private readonly ActivosCuentoService $activos,
    ) {}

    public function asistir(AsistirCuentoV2Request $request)
    {
        try {
            $texto = $this->asistente->asistir($request->user(), $request->validated());
        } catch (CuentoV2Exception $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            Log::warning('Proveedor de IA de Cuentos no disponible.', [
                'exception_type' => $exception::class,
                'usuario_id' => $request->user()?->id,
            ]);
            throw new CuentoV2Exception(
                'El asistente creativo no estÃ¡ disponible ahora. IntÃ©ntalo nuevamente.',
                503,
                'IA_NO_DISPONIBLE',
            );
        }

        return response()->json(['texto' => $texto]);
    }

    public function subirActivo(SubirActivoCuentoV2Request $request, string $cuentoId)
    {
        $datos = $request->validated();

        return response()->json($this->activos->subir(
            $request->user(),
            $cuentoId,
            $request->file('archivo'),
            $datos['tipo'],
            $datos['pagina_id'] ?? null,
            $datos['idempotencia'],
        ), 201);
    }

    public function urlActivo(GestionarActivoCuentoV2Request $request, string $cuentoId)
    {
        return response()->json([
            'url_lectura' => $this->activos->urlLectura(
                $request->user(),
                $cuentoId,
                $request->validated('referencia'),
            ),
        ]);
    }

    public function eliminarActivo(GestionarActivoCuentoV2Request $request, string $cuentoId)
    {
        $this->activos->eliminar($request->user(), $cuentoId, $request->validated('referencia'));

        return response()->noContent();
    }

    public function limpiarActivos(LimpiarActivosCuentoV2Request $request, string $cuentoId)
    {
        return response()->json(
            $this->activos->limpiar($request->user(), $cuentoId, $request->validated('referencias')),
        );
    }

    public function solicitarPublicacion(ComandoCuentoV2Request $request, string $cuentoId)
    {
        return response()->json($this->cuentos->solicitarPublicacion($request->user(), $cuentoId));
    }

    public function eliminar(ComandoCuentoV2Request $request, string $cuentoId)
    {
        return response()->json($this->cuentos->eliminar($request->user(), $cuentoId));
    }

    public function comentar(ComentarCuentoV2Request $request, string $cuentoId)
    {
        $datos = $request->validated();

        return response()->json(
            $this->cuentos->comentar($request->user(), $cuentoId, $datos['cuerpo'], $datos['idempotencia']),
            201,
        );
    }

    public function editarComentario(
        EditarComentarioCuentoV2Request $request,
        string $cuentoId,
        string $comentarioId,
    ) {
        return response()->json(
            $this->cuentos->editarComentario(
                $request->user(),
                $cuentoId,
                $comentarioId,
                $request->validated('cuerpo'),
            ),
        );
    }

    public function eliminarComentario(Request $request, string $cuentoId, string $comentarioId)
    {
        abort_unless($request->user()?->rol === 'alumno', 403);
        $this->cuentos->eliminarComentario($request->user(), $cuentoId, $comentarioId);

        return response()->noContent();
    }

    public function reaccionar(ReaccionarCuentoV2Request $request, string $cuentoId)
    {
        return response()->json(
            $this->cuentos->reaccionar($request->user(), $cuentoId, $request->validated('tipo')),
        );
    }

    public function estadisticas(Request $request, string $cuentoId)
    {
        abort_unless($request->user()?->rol === 'alumno', 403);

        return response()->json($this->cuentos->estadisticas($request->user(), $cuentoId));
    }

    public function publicarModerado(PublicarCuentoV2AdminRequest $request, string $cuentoId)
    {
        return response()->json(
            $this->cuentos->publicarModerado(
                $request->user(),
                $cuentoId,
                $request->validated('visibilidad'),
            ),
        );
    }
}
