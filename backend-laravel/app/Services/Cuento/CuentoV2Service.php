<?php

namespace App\Services\Cuento;

use App\Contracts\Cuento\CuentoDocumentoGateway;
use App\Exceptions\CuentoV2Exception;
use App\Models\Usuario;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;

class CuentoV2Service
{
    /** @var list<string> */
    private const TIPOS_REACCION = ['encanto', 'increible', 'gusto', 'sorprendio', 'interesante'];

    public function __construct(private readonly CuentoDocumentoGateway $documentos) {}

    /** @return array{estado: string, repetido: bool} */
    public function solicitarPublicacion(Usuario $usuario, string $cuentoId): array
    {
        return Cache::lock($this->lockKey($cuentoId), 10)->block(3, function () use ($usuario, $cuentoId): array {
            $cuento = $this->cuentoPropio($usuario, $cuentoId);
            $estado = $cuento['fields']['estado'] ?? null;
            if ($estado === 'en_revision') {
                return ['estado' => 'en_revision', 'repetido' => true];
            }
            if ($estado !== 'borrador') {
                throw new CuentoV2Exception('El cuento ya no está en estado borrador.', 409, 'TRANSICION_INVALIDA');
            }

            $versionId = $this->stringRequerido($cuento['fields'], 'version_borrador_id');
            $version = $this->documentos->obtener($this->versionPath($cuentoId, $versionId));
            if ($version === null
                || trim((string) ($version['fields']['titulo'] ?? '')) === ''
                || (int) ($version['fields']['paginas'] ?? 0) < 1
                || (int) ($version['fields']['palabras'] ?? 0) < 1) {
                throw new CuentoV2Exception(
                    'Completa el título y al menos una página antes de enviar a revisión.',
                    422,
                    'BORRADOR_INCOMPLETO',
                );
            }

            $this->documentos->actualizar(
                $this->cuentoPath($cuentoId),
                [
                    'estado' => 'en_revision',
                    'moderacion_estado' => 'pendiente',
                    'visibilidad' => 'privado',
                    'comentarios_bloqueados' => true,
                ],
                ['submitted_at', 'updated_at'],
                $cuento['updateTime'],
            );

            return ['estado' => 'en_revision', 'repetido' => false];
        });
    }

    /** @return array{estado: string, repetido: bool} */
    public function eliminar(Usuario $usuario, string $cuentoId): array
    {
        return Cache::lock($this->lockKey($cuentoId), 10)->block(3, function () use ($usuario, $cuentoId): array {
            $cuento = $this->cuentoPropio($usuario, $cuentoId);
            if (($cuento['fields']['estado'] ?? null) === 'eliminado') {
                return ['estado' => 'eliminado', 'repetido' => true];
            }

            $this->documentos->actualizar(
                $this->cuentoPath($cuentoId),
                [
                    'estado' => 'eliminado',
                    'visibilidad' => 'privado',
                    'comentarios_bloqueados' => true,
                ],
                ['deleted_at', 'updated_at'],
                $cuento['updateTime'],
            );

            return ['estado' => 'eliminado', 'repetido' => false];
        });
    }

    /** @return array{estado: string, repetido: bool} */
    public function publicarModerado(Usuario $actor, string $cuentoId, string $visibilidad): array
    {
        if (! in_array($actor->rol, ['docente', 'admin'], true)) {
            throw new CuentoV2Exception('No puedes publicar cuentos moderados.', 403, 'ROL_INSUFICIENTE');
        }

        return Cache::lock($this->lockKey($cuentoId), 10)->block(3, function () use ($cuentoId, $visibilidad): array {
            $cuento = $this->documentos->obtener($this->cuentoPath($cuentoId));
            if ($cuento === null || (int) ($cuento['fields']['schema_version'] ?? 0) !== 2) {
                throw new CuentoV2Exception('El cuento no existe.', 404, 'CUENTO_NO_ENCONTRADO');
            }
            if (($cuento['fields']['estado'] ?? null) === 'publicado') {
                return ['estado' => 'publicado', 'repetido' => true];
            }
            if (($cuento['fields']['estado'] ?? null) !== 'en_revision') {
                throw new CuentoV2Exception('El cuento no está pendiente de revisión.', 409, 'TRANSICION_INVALIDA');
            }

            $versionId = $this->stringRequerido($cuento['fields'], 'version_borrador_id');
            $versionRuta = $this->versionPath($cuentoId, $versionId);
            $version = $this->documentos->obtener($versionRuta);
            if ($version === null) {
                throw new CuentoV2Exception('La versión pendiente no existe.', 409, 'VERSION_NO_ENCONTRADA');
            }
            if (($version['fields']['estado'] ?? null) !== 'publicada') {
                $version = $this->documentos->actualizar(
                    $versionRuta,
                    ['estado' => 'publicada'],
                    ['updated_at'],
                    $version['updateTime'],
                );
            }

            $autor = Usuario::query()
                ->where('firebase_uid', $this->stringRequerido($cuento['fields'], 'autor_uid'))
                ->first();
            $campos = [
                'estado' => 'publicado',
                'moderacion_estado' => 'aprobado',
                'visibilidad' => $visibilidad,
                'version_publicada_id' => $versionId,
                'titulo_publicado' => (string) ($version['fields']['titulo'] ?? ''),
                'sinopsis_publicada' => (string) ($version['fields']['sinopsis'] ?? ''),
                'categoria_publicada' => (string) ($version['fields']['categoria'] ?? ''),
                'rango_edad_publicado' => (string) ($version['fields']['rango_edad'] ?? ''),
                'paginas_publicadas' => (int) ($version['fields']['paginas'] ?? 1),
                'palabras_publicadas' => (int) ($version['fields']['palabras'] ?? 0),
                'portada_ref' => $version['fields']['portada_ref'] ?? null,
                'comentarios_bloqueados' => false,
                'stats' => $cuento['fields']['stats'] ?? [
                    'comentarios' => 0,
                    'reacciones' => 0,
                    'lecturas' => 0,
                ],
            ];
            if ($autor !== null) {
                $campos['autor_usuario_id'] = (int) $autor->id;
                $campos['autor_perfil'] = [
                    'nombre' => mb_substr(trim((string) ($autor->nombre_completo ?: $autor->usuario ?: 'Autor DAEMON')), 0, 80),
                    'avatar_ref' => $autor->avatar ?: null,
                ];
            }

            $this->documentos->actualizar(
                $this->cuentoPath($cuentoId),
                $campos,
                ['published_at', 'updated_at'],
                $cuento['updateTime'],
            );

            return ['estado' => 'publicado', 'repetido' => false];
        });
    }

    /** @return array<string, mixed> */
    public function comentar(Usuario $usuario, string $cuentoId, string $cuerpo, string $idempotencia): array
    {
        $uid = $this->uid($usuario);
        $this->cuentoComentable($cuentoId);
        $limpio = $this->sanitizarComentario($cuerpo);
        $comentarioId = substr(hash('sha256', $uid.'|'.$cuentoId.'|'.$idempotencia), 0, 40);
        $ruta = $this->comentarioPath($cuentoId, $comentarioId);
        $existente = $this->documentos->obtener($ruta);
        if ($existente !== null) {
            $this->asegurarComentarioPropio($existente, $uid);

            return $this->comentarioRespuesta($cuentoId, $comentarioId, $existente);
        }

        try {
            $documento = $this->documentos->crear(
                $ruta,
                [
                    'schema_version' => 2,
                    'autor_uid' => $uid,
                    'cuerpo' => $limpio,
                    'estado' => 'visible',
                ],
                ['created_at', 'updated_at'],
            );
        } catch (CuentoV2Exception $exception) {
            if ($exception->httpStatus !== 409) {
                throw $exception;
            }
            $documento = $this->documentos->obtener($ruta);
            if ($documento === null) {
                throw $exception;
            }
            $this->asegurarComentarioPropio($documento, $uid);
        }

        return $this->comentarioRespuesta($cuentoId, $comentarioId, $documento);
    }

    /** @return array<string, mixed> */
    public function editarComentario(
        Usuario $usuario,
        string $cuentoId,
        string $comentarioId,
        string $cuerpo,
    ): array {
        $uid = $this->uid($usuario);
        $this->cuentoComentable($cuentoId);
        $ruta = $this->comentarioPath($cuentoId, $comentarioId);
        $comentario = $this->documentos->obtener($ruta);
        if ($comentario === null) {
            throw new CuentoV2Exception('El comentario no existe.', 404, 'COMENTARIO_NO_ENCONTRADO');
        }
        $this->asegurarComentarioPropio($comentario, $uid);
        if (($comentario['fields']['estado'] ?? null) !== 'visible') {
            throw new CuentoV2Exception('El comentario ya no se puede editar.', 409, 'COMENTARIO_NO_EDITABLE');
        }
        $actualizado = $this->documentos->actualizar(
            $ruta,
            ['cuerpo' => $this->sanitizarComentario($cuerpo)],
            ['updated_at'],
            $comentario['updateTime'],
        );

        return $this->comentarioRespuesta($cuentoId, $comentarioId, $actualizado);
    }

    public function eliminarComentario(Usuario $usuario, string $cuentoId, string $comentarioId): void
    {
        $uid = $this->uid($usuario);
        $ruta = $this->comentarioPath($cuentoId, $comentarioId);
        $comentario = $this->documentos->obtener($ruta);
        if ($comentario === null || ($comentario['fields']['estado'] ?? null) === 'eliminado') {
            return;
        }
        $this->asegurarComentarioPropio($comentario, $uid);
        $this->documentos->actualizar(
            $ruta,
            ['estado' => 'eliminado', 'cuerpo' => ''],
            ['updated_at'],
            $comentario['updateTime'],
        );
    }

    /** @return array{tipo: string|null, repetido: bool} */
    public function reaccionar(Usuario $usuario, string $cuentoId, ?string $tipo): array
    {
        if ($tipo !== null && ! in_array($tipo, self::TIPOS_REACCION, true)) {
            throw new CuentoV2Exception('La reacciÃ³n no es vÃ¡lida.', 422, 'REACCION_INVALIDA');
        }
        $uid = $this->uid($usuario);
        $this->cuentoComentable($cuentoId);

        return Cache::lock($this->lockKey($cuentoId.':'.$uid), 10)->block(3, function () use ($cuentoId, $tipo, $uid): array {
            $ruta = $this->reaccionPath($cuentoId, $uid);
            $existente = $this->documentos->obtener($ruta);
            $tipoActual = $existente['fields']['tipo'] ?? null;
            if ($tipoActual === $tipo) {
                return ['tipo' => $tipo, 'repetido' => true];
            }
            if ($tipo === null) {
                if ($existente !== null) {
                    $this->documentos->eliminar($ruta, $existente['updateTime']);
                }

                return ['tipo' => null, 'repetido' => $existente === null];
            }
            if ($existente === null) {
                $this->documentos->crear(
                    $ruta,
                    ['schema_version' => 2, 'usuario_uid' => $uid, 'tipo' => $tipo],
                    ['created_at', 'updated_at'],
                );
            } else {
                $this->documentos->actualizar(
                    $ruta,
                    ['tipo' => $tipo],
                    ['updated_at'],
                    $existente['updateTime'],
                );
            }

            return ['tipo' => $tipo, 'repetido' => false];
        });
    }

    /**
     * @return array{
     *   comentarios: int,
     *   reacciones: array{total: int, propia: string|null, por_tipo: array<string, int>}
     * }
     */
    public function estadisticas(Usuario $usuario, string $cuentoId): array
    {
        $this->cuentoComentable($cuentoId);
        $porTipo = [];
        foreach (self::TIPOS_REACCION as $tipo) {
            $porTipo[$tipo] = $this->documentos->contar(
                $this->reaccionesPath($cuentoId),
                ['schema_version' => 2, 'tipo' => $tipo],
            );
        }
        $propia = $this->documentos->obtener($this->reaccionPath($cuentoId, $this->uid($usuario)));
        $tipoPropio = $propia['fields']['tipo'] ?? null;

        return [
            'comentarios' => $this->documentos->contar(
                $this->comentariosPath($cuentoId),
                ['schema_version' => 2, 'estado' => 'visible'],
            ),
            'reacciones' => [
                'total' => array_sum($porTipo),
                'propia' => in_array($tipoPropio, self::TIPOS_REACCION, true) ? $tipoPropio : null,
                'por_tipo' => $porTipo,
            ],
        ];
    }

    /** @return array{name: string, fields: array<string, mixed>, updateTime: string} */
    private function cuentoPropio(Usuario $usuario, string $cuentoId): array
    {
        $cuento = $this->documentos->obtener($this->cuentoPath($cuentoId));
        if ($cuento === null || (int) ($cuento['fields']['schema_version'] ?? 0) !== 2) {
            throw new CuentoV2Exception('El cuento no existe.', 404, 'CUENTO_NO_ENCONTRADO');
        }
        if (($cuento['fields']['autor_uid'] ?? null) !== $this->uid($usuario)) {
            throw new CuentoV2Exception('No puedes modificar este cuento.', 403, 'CUENTO_AJENO');
        }

        return $cuento;
    }

    /** @return array{name: string, fields: array<string, mixed>, updateTime: string} */
    private function cuentoComentable(string $cuentoId): array
    {
        $cuento = $this->documentos->obtener($this->cuentoPath($cuentoId));
        if ($cuento === null
            || (int) ($cuento['fields']['schema_version'] ?? 0) !== 2
            || ($cuento['fields']['estado'] ?? null) !== 'publicado'
            || ($cuento['fields']['moderacion_estado'] ?? null) !== 'aprobado'
            || ($cuento['fields']['comentarios_bloqueados'] ?? true) !== false) {
            throw new CuentoV2Exception('Este cuento no admite comentarios.', 403, 'COMENTARIOS_BLOQUEADOS');
        }

        return $cuento;
    }

    private function uid(Usuario $usuario): string
    {
        $uid = trim((string) $usuario->firebase_uid);
        if ($uid === '') {
            throw new CuentoV2Exception('La cuenta no está enlazada con Firebase.', 409, 'FIREBASE_UID_AUSENTE');
        }

        return $uid;
    }

    private function sanitizarComentario(string $cuerpo): string
    {
        $limpio = trim(strip_tags(html_entity_decode($cuerpo, ENT_QUOTES | ENT_HTML5, 'UTF-8')));
        $limpio = preg_replace('/\s+/u', ' ', $limpio) ?? '';
        if ($limpio === '' || mb_strlen($limpio) > 1000) {
            throw new CuentoV2Exception('El comentario debe tener entre 1 y 1000 caracteres.', 422, 'COMENTARIO_INVALIDO');
        }

        return $limpio;
    }

    /**
     * @param  array{name: string, fields: array<string, mixed>, updateTime: string}  $comentario
     */
    private function asegurarComentarioPropio(array $comentario, string $uid): void
    {
        if (($comentario['fields']['autor_uid'] ?? null) !== $uid) {
            throw new CuentoV2Exception('No puedes modificar este comentario.', 403, 'COMENTARIO_AJENO');
        }
    }

    /**
     * @param  array{name: string, fields: array<string, mixed>, updateTime: string}  $documento
     * @return array<string, mixed>
     */
    private function comentarioRespuesta(string $cuentoId, string $comentarioId, array $documento): array
    {
        $campos = $documento['fields'];

        return [
            'id' => $comentarioId,
            'cuento_id' => $cuentoId,
            'autor_uid' => $campos['autor_uid'] ?? '',
            'cuerpo' => $campos['cuerpo'] ?? '',
            'estado' => $campos['estado'] ?? 'visible',
            'created_at_ms' => $this->timestampMilisegundos($campos['created_at'] ?? null),
            'updated_at_ms' => $this->timestampMilisegundos($campos['updated_at'] ?? null),
        ];
    }

    private function timestampMilisegundos(mixed $valor): int
    {
        if (! is_string($valor) || $valor === '') {
            throw new CuentoV2Exception('Firestore no devolvió un timestamp válido.', 502, 'TIMESTAMP_FIRESTORE_INVALIDO');
        }

        return CarbonImmutable::parse($valor)->getTimestampMs();
    }

    /** @param array<string, mixed> $campos */
    private function stringRequerido(array $campos, string $campo): string
    {
        $valor = $campos[$campo] ?? null;
        if (! is_string($valor) || $valor === '') {
            throw new CuentoV2Exception("El cuento no contiene {$campo}.", 422, 'CUENTO_INVALIDO');
        }

        return $valor;
    }

    private function cuentoPath(string $cuentoId): string
    {
        return 'cuentos/'.$this->idSeguro($cuentoId);
    }

    private function versionPath(string $cuentoId, string $versionId): string
    {
        return $this->cuentoPath($cuentoId).'/versiones/'.$this->idSeguro($versionId);
    }

    private function comentarioPath(string $cuentoId, string $comentarioId): string
    {
        return $this->cuentoPath($cuentoId).'/comentarios/'.$this->idSeguro($comentarioId);
    }

    private function comentariosPath(string $cuentoId): string
    {
        return $this->cuentoPath($cuentoId).'/comentarios';
    }

    private function reaccionesPath(string $cuentoId): string
    {
        return $this->cuentoPath($cuentoId).'/reacciones';
    }

    private function reaccionPath(string $cuentoId, string $uid): string
    {
        return $this->reaccionesPath($cuentoId).'/'.substr(hash('sha256', $uid), 0, 40);
    }

    private function idSeguro(string $id): string
    {
        if (! preg_match('/^[A-Za-z0-9_-]{1,128}$/', $id)) {
            throw new CuentoV2Exception('El identificador de cuento no es válido.', 422, 'ID_CUENTO_INVALIDO');
        }

        return $id;
    }

    private function lockKey(string $cuentoId): string
    {
        return 'cuentos:v2:'.hash('sha256', $cuentoId);
    }
}
