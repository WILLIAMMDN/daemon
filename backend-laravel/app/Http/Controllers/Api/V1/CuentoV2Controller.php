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
use App\Http\Requests\Api\V1\Cuento\GuardarBorradorCuentoV2Request;
use App\Services\Cuento\CuentoV2Service;
use App\Services\Cuento\CuentoService;
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
        private readonly CuentoService $cuentosLegacy,
        private readonly AsistenteCuentoService $asistente,
        private readonly ActivosCuentoService $activos,
    ) {}

    public function galeria(Request $request)
    {
        $v2 = $this->cuentos->galeria((int) $request->query('limite', 24));
        $legacy = [];
        try {
            $legacy = $this->cuentosLegacy->galeria();
        } catch (Throwable $exception) {
            // La galería v2 no debe caerse si el legado PostgreSQL falla
            // (ej. tabla pendiente de migración). Se loguea y se omite.
            Log::warning('Galeria legacy no disponible para fusionar.', [
                'exception_type' => $exception::class,
                'message' => $exception->getMessage(),
            ]);
        }
        $elementos = $this->fusionarGaleria($v2, $legacy);

        return response()->json([
            'elementos' => $elementos,
            'siguiente_cursor' => null,
        ]);
    }

    /**
     * Fusiona la galería v2 (Firestore) con los cuentos legacy (PostgreSQL).
     * Los v2 van primero (son los más recientes); los legacy se incluyen
     * como tarjetas públicas con identidad propia.
     *
     * @param  list<array<string, mixed>>  $v2
     * @param  \Illuminate\Support\Collection<int, object>  $legacy
     * @return list<array<string, mixed>>
     */
    private function fusionarGaleria(array $v2, $legacy): array
    {
        $legacyMap = [];
        foreach ($legacy as $cuento) {
            $portada = null;
            foreach (range(1, 6) as $indice) {
                $campo = 'img_'.$indice;
                if (property_exists($cuento, $campo) && ! empty($cuento->{$campo})) {
                    $portada = $cuento->{$campo};
                    break;
                }
            }
            $timestamp = strtotime((string) ($cuento->fecha_creacion ?? '')) ?: time();
            $legacyMap['legacy-'.$cuento->id] = [
                'id' => 'legacy-'.$cuento->id,
                'autor_uid' => 'legacy-'.($cuento->id_alumno ?? 0),
                'autor_usuario_id' => $cuento->id_alumno ?? null,
                'autor_perfil' => [
                    'nombre' => (string) ($cuento->autor ?? 'Autor DAEMON'),
                    'avatar_ref' => $cuento->avatar ?? null,
                ],
                'titulo' => (string) ($cuento->titulo ?? 'Historia sin título'),
                'descripcion' => mb_substr((string) ($cuento->contenido ?? ''), 0, 200),
                'portada_ref' => $portada,
                'categoria' => 'Sin clasificar',
                'rango_edad' => '',
                'paginas_borrador' => 0,
                'palabras' => 0,
                'estado' => 'publicado',
                'visibilidad' => 'comunidad',
                'audiencia' => 'TEENS',
                'moderacion' => 'aprobado',
                'estadisticas' => [
                    'comentarios' => 0,
                    'reacciones' => (int) ($cuento->reacciones_count ?? 0),
                    'lecturas' => 0,
                ],
                'version_borrador_id' => '',
                'version_publicada_id' => null,
                'created_at_ms' => $timestamp * 1000,
                'updated_at_ms' => $timestamp * 1000,
                'published_at_ms' => $timestamp * 1000,
                'schema_version' => 2,
            ];
        }

        $v2Ids = array_map(fn (array $c): string => (string) $c['id'], $v2);
        $soloLegacy = array_values(array_filter($legacyMap, fn (array $c): bool => ! in_array($c['id'], $v2Ids, true)));

        return [...$v2, ...$soloLegacy];
    }

    public function mios(Request $request)
    {
        return response()->json($this->cuentos->mios($request->user(), (int) $request->query('limite', 20)));
    }

    public function detalle(Request $request, string $cuentoId)
    {
        return response()->json($this->cuentos->detalle($request->user(), $cuentoId));
    }

    public function comentarios(Request $request, string $cuentoId)
    {
        return response()->json([
            'elementos' => $this->cuentos->comentarios($cuentoId, (int) $request->query('limite', 20)),
            'siguiente_cursor' => null,
        ]);
    }

    public function reservarBorrador(ReservarBorradorCuentoV2Request $request)
    {
        return response()->json($this->cuentos->reservarBorrador($request->user(), $request->validated()), 201);
    }

    public function guardarBorrador(GuardarBorradorCuentoV2Request $request, string $cuentoId)
    {
        return response()->json($this->cuentos->guardarBorrador($request->user(), $request->validated()));
    }

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
