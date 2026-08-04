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

    /**
     * Galería pública: cuentos publicados, aprobados y visibles para la
     * comunidad, ordenados por fecha de actualización descendente.
     *
     * @return list<array<string, mixed>>
     */
    public function galeria(int $limite = 24): array
    {
        // Un solo filtro de igualdad (estado) cubre ambos esquemas de
        // Firestore sin exigir índice compuesto: el v2 nuevo (schema_version
        // 2, visibilidad "comunidad") y el legado que escribía visibilidad
        // "publico" con páginas embebidas en un array.
        $documentos = $this->documentos->listar('cuentos', ['estado' => 'publicado']);

        return collect($documentos)
            ->filter(fn (array $documento): bool => $this->esVisibleEnGaleria($documento['fields']))
            ->sortByDesc(fn (array $documento): string => (string) $documento['updateTime'])
            ->values()
            ->take(max(1, min($limite, 50)))
            ->map(fn (array $documento): array => $this->cuentoPublico($documento))
            ->all();
    }

    /**
     * Cuentos del alumno autenticado (todos sus estados).
     *
     * @return list<array<string, mixed>>
     */
    public function mios(Usuario $usuario, int $limite = 20): array
    {
        // Si hay firebase_uid se usa; si no, el UID determinista (daemon-{id})
        // con el que el usuario creó sus borradores desde el editor.
        $uid = $this->uidParaEscritura($usuario);
        $documentos = $this->documentos->listar('cuentos');

        return collect($documentos)
            ->filter(fn (array $documento): bool => $this->esCuentoDelUsuario($documento['fields'], $usuario, $uid))
            ->filter(fn (array $documento): bool => ($documento['fields']['estado'] ?? null) !== 'eliminado')
            ->sortByDesc(fn (array $documento): string => (string) $documento['updateTime'])
            ->values()
            ->take(max(1, min($limite, 50)))
            ->map(fn (array $documento): array => $this->cuentoCompleto($documento, $usuario))
            ->all();
    }

    /**
     * Detalle de un cuento: cabecera + versión visible + páginas.
     *
     * @return array{
     *   cuento: array<string, mixed>,
     *   version: array<string, mixed>|null,
     *   paginas: list<array<string, mixed>>
     * }
     */
    public function detalle(Usuario $usuario, string $cuentoId): array
    {
        $cuento = $this->documentos->obtener($this->cuentoPath($cuentoId));
        if ($cuento === null) {
            throw new CuentoV2Exception('El cuento no existe.', 404, 'CUENTO_NO_ENCONTRADO');
        }

        $campos = $cuento['fields'];
        $esV2 = (int) ($campos['schema_version'] ?? 0) === 2;
        if (! $esV2 && ! $this->tienePaginasLegado($campos)) {
            throw new CuentoV2Exception('El cuento no existe.', 404, 'CUENTO_NO_ENCONTRADO');
        }

        $esPropio = ($campos['autor_uid'] ?? null) === $this->uidParaEscritura($usuario)
            || (int) ($campos['id_alumno'] ?? 0) === (int) $usuario->id;

        $version = null;
        $paginas = [];
        if ($esV2) {
            $versionId = $esPropio
                ? ($campos['version_borrador_id'] ?? null)
                : ($campos['version_publicada_id'] ?? null);
            if (is_string($versionId) && $versionId !== '') {
                $versionDoc = $this->documentos->obtener($this->versionPath($cuentoId, $versionId));
                if ($versionDoc !== null) {
                    $version = $this->versionPublica($cuentoId, $versionId, $versionDoc['fields']);
                    $paginas = $this->paginasDeVersion($cuentoId, $versionId);
                }
            }
        } else {
            // Esquema legado de Firestore: páginas embebidas en el campo
            // "paginas" (array de mapas con id/contenido/colorFondo/ilustracion).
            $version = $this->versionLegado($cuentoId, $campos);
            $paginas = $this->paginasLegado($cuentoId, $campos);
        }

        return [
            'cuento' => $this->cuentoPublico($cuento),
            'version' => $version,
            'paginas' => $paginas,
        ];
    }

    /**
     * Comentarios visibles de un cuento.
     *
     * @return list<array<string, mixed>>
     */
    public function comentarios(string $cuentoId, int $limite = 20): array
    {
        $documentos = $this->documentos->listar(
            $this->comentariosPath($cuentoId),
            ['schema_version' => 2, 'estado' => 'visible'],
            ['created_at', 'ASC'],
            max(1, min($limite, 50)),
        );

        return collect($documentos)
            ->map(fn (array $documento): array => $this->comentarioPublico($cuentoId, $documento))
            ->all();
    }

    /**
     * Crea un borrador nuevo: reserva identidad, crea cabecera y versión.
     *
     * @param  array{cuento_id?: string, version_id?: string}  $datos
     * @return array{cuento_id: string, version_id: string}
     */
    public function reservarBorrador(Usuario $usuario, array $datos): array
    {
        $uid = $this->uidParaEscritura($usuario);
        $cuentoId = trim((string) ($datos['cuento_id'] ?? ''));
        $versionId = trim((string) ($datos['version_id'] ?? ''));
        if ($cuentoId === '' || $versionId === '') {
            throw new CuentoV2Exception('Faltan los identificadores del borrador.', 422, 'BORRADOR_INVALIDO');
        }

        $existe = $this->documentos->obtener($this->cuentoPath($cuentoId));
        if ($existe === null) {
            $this->documentos->crear(
                $this->cuentoPath($cuentoId),
                [
                    'schema_version' => 2,
                    'autor_uid' => $uid,
                    'audiencia' => $this->audiencia($usuario),
                    'estado' => 'borrador',
                    'visibilidad' => 'privado',
                    'version_borrador_id' => $versionId,
                    'moderacion_estado' => 'no_solicitada',
                    'comentarios_bloqueados' => true,
                ],
                ['created_at', 'updated_at'],
            );
        }

        return ['cuento_id' => $cuentoId, 'version_id' => $versionId];
    }

    /**
     * Guarda (crea o actualiza) la versión de borrador y sus páginas.
     * Idempotente: si la revisión coincide, escribe; si no, devuelve
     * conflicto para que el cliente decida.
     *
     * @param  array{
     *   cuento_id: string, version_id: string, titulo: string, sinopsis: string,
     *   categoria: string, rango_edad: string, portada_ref: string|null,
     *   revision_esperada: int, paginas: list<array<string, mixed>>
     * }  $datos
     * @return array<string, mixed>
     */
    public function guardarBorrador(Usuario $usuario, array $datos): array
    {
        $cuentoId = $datos['cuento_id'];
        $versionId = $datos['version_id'];
        $uid = $this->uidParaEscritura($usuario);

        return Cache::lock($this->lockKey($cuentoId), 10)->block(3, function () use ($datos, $cuentoId, $versionId, $uid): array {
            $cuento = $this->documentos->obtener($this->cuentoPath($cuentoId));
            if ($cuento === null || (int) ($cuento['fields']['schema_version'] ?? 0) !== 2) {
                throw new CuentoV2Exception('El cuento no existe.', 404, 'CUENTO_NO_ENCONTRADO');
            }
            if (($cuento['fields']['autor_uid'] ?? null) !== $uid) {
                throw new CuentoV2Exception('No puedes modificar este cuento.', 403, 'CUENTO_AJENO');
            }
            if (($cuento['fields']['estado'] ?? null) !== 'borrador') {
                throw new CuentoV2Exception('La versión ya no admite edición.', 409, 'TRANSICION_INVALIDA');
            }

            $versionRuta = $this->versionPath($cuentoId, $versionId);
            $version = $this->documentos->obtener($versionRuta);
            $revisionEsperada = (int) $datos['revision_esperada'];
            $revisionActual = $version === null ? 0 : (int) ($version['fields']['revision'] ?? 0);
            if ($version !== null && $revisionActual !== $revisionEsperada) {
                throw new CuentoV2Exception(
                    'El borrador cambió en otra pestaña. Recarga para ver la versión más reciente.',
                    409,
                    'CONFLICTO_REVISION',
                );
            }

            $palabras = 0;
            foreach ($datos['paginas'] as $pagina) {
                $textoPlano = trim(strip_tags((string) ($pagina['contenido'] ?? '')));
                $palabras += $textoPlano === '' ? 0 : count(preg_split('/\s+/u', $textoPlano));
            }
            $camposVersion = [
                'schema_version' => 2,
                'autor_uid' => $uid,
                'estado' => 'borrador',
                'titulo' => trim((string) ($datos['titulo'] ?? '')) !== ''
                    ? trim((string) $datos['titulo'])
                    : 'Historia sin título',
                'sinopsis' => (string) ($datos['sinopsis'] ?? ''),
                'categoria' => trim((string) ($datos['categoria'] ?? '')) !== ''
                    ? trim((string) $datos['categoria'])
                    : 'Sin clasificar',
                'rango_edad' => (string) ($datos['rango_edad'] ?? ''),
                'portada_ref' => $datos['portada_ref'] ?? null,
                'paginas' => count($datos['paginas']),
                'idioma' => 'es-PE',
                'palabras' => $palabras,
                'tiempo_lectura' => max(1, (int) ceil($palabras / 200)),
                'revision' => $version === null ? 0 : $revisionActual + 1,
            ];

            if ($version === null) {
                $this->documentos->crear($versionRuta, $camposVersion, ['created_at', 'updated_at']);
            } else {
                $this->documentos->actualizar(
                    $versionRuta,
                    $camposVersion,
                    ['updated_at'],
                    $version['updateTime'],
                );
            }

            // Escribir páginas (upsert por orden/id).
            $existentes = $this->documentos->listar(
                $this->cuentoPath($cuentoId).'/versiones/'.$this->idSeguro($versionId).'/paginas',
                [],
                null,
                100,
            );
            $existentesPorId = collect($existentes)
                ->mapWithKeys(fn (array $doc): array => [basename((string) $doc['name']) => $doc])
                ->all();
            $idsNuevos = [];
            foreach ($datos['paginas'] as $pagina) {
                $paginaId = (string) $pagina['id'];
                $idsNuevos[] = $paginaId;
                $rutaPagina = $this->cuentoPath($cuentoId).'/versiones/'.$this->idSeguro($versionId).'/paginas/'.$this->idSeguro($paginaId);
                $camposPagina = [
                    'schema_version' => 2,
                    'autor_uid' => $uid,
                    'orden' => (int) $pagina['orden'],
                    'contenido' => (string) $pagina['contenido'],
                    'ilustracion_ref' => $pagina['ilustracion_ref'] ?? null,
                    'texto_alternativo' => (string) ($pagina['texto_alternativo'] ?? ''),
                    'fondo_token' => (string) ($pagina['fondo_token'] ?? 'var(--daemon-surface)'),
                ];
                if (isset($existentesPorId[$paginaId])) {
                    $this->documentos->actualizar(
                        $rutaPagina,
                        $camposPagina,
                        ['updated_at'],
                        $existentesPorId[$paginaId]['updateTime'],
                    );
                } else {
                    $this->documentos->crear($rutaPagina, $camposPagina, ['created_at', 'updated_at']);
                }
            }
            foreach ($existentesPorId as $idExistente => $docExistente) {
                if (! in_array($idExistente, $idsNuevos, true)) {
                    $this->documentos->eliminar(
                        $this->cuentoPath($cuentoId).'/versiones/'.$this->idSeguro($versionId).'/paginas/'.$this->idSeguro($idExistente),
                        $docExistente['updateTime'],
                    );
                }
            }

            // Actualizar cabecera del cuento (timestamp de servidor).
            $this->documentos->actualizar(
                $this->cuentoPath($cuentoId),
                ['version_borrador_id' => $versionId],
                ['updated_at'],
                $cuento['updateTime'],
            );

            return $this->detalle($usuario, $cuentoId);
        });
    }

    /**
     * true si el cuento de Firestore usa el esquema legado (publicado antes
     * del paquete 4). Las operaciones de escritura v2 no aplican ahí.
     */
    private function esEsquemaLegado(string $cuentoId): bool
    {
        $cuento = $this->documentos->obtener($this->cuentoPath($cuentoId));

        return $cuento !== null && (int) ($cuento['fields']['schema_version'] ?? 0) !== 2;
    }

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
        $cuento = $this->documentos->obtener($this->cuentoPath($cuentoId));
        if ($cuento === null || (int) ($cuento['fields']['schema_version'] ?? 0) !== 2) {
            // Cuento legado de Firestore: contadores en la cabecera o cero.
            $reacciones = (int) ($cuento['fields']['reacciones_count'] ?? 0);
            $porTipo = collect(self::TIPOS_REACCION)->mapWithKeys(
                fn (string $tipo): array => [$tipo => 0],
            )->all();
            if ($reacciones > 0) {
                $porTipo['encanto'] = $reacciones;
            }

            return [
                'comentarios' => 0,
                'reacciones' => [
                    'total' => $reacciones,
                    'propia' => null,
                    'por_tipo' => $porTipo,
                ],
            ];
        }

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
        if (($cuento['fields']['autor_uid'] ?? null) !== $this->uidParaEscritura($usuario)) {
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

    private function uidOpcional(Usuario $usuario): ?string
    {
        $uid = trim((string) $usuario->firebase_uid);

        return $uid !== '' ? $uid : null;
    }

    /**
     * UID para operaciones de escritura server-side. Si el usuario ya está
     * enlazado con Firebase se usa su firebase_uid; si no, se usa un UID
     * determinista estable (daemon-{id}) igual al que emite
     * FirebaseCustomTokenService, para que el alumno conserve su identidad
     * entre sesiones aunque aún no tenga cuenta Google.
     */
    private function uidParaEscritura(Usuario $usuario): string
    {
        $uid = trim((string) $usuario->firebase_uid);

        return $uid !== '' ? $uid : 'daemon-'.$usuario->id;
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

    /** @param array<string, mixed> $campos */
    private function esVisibleEnGaleria(array $campos): bool
    {
        if (($campos['estado'] ?? null) !== 'publicado' || ($campos['deleted_at'] ?? null) !== null) {
            return false;
        }
        $visibilidad = (string) ($campos['visibilidad'] ?? '');
        // Esquema nuevo usa "comunidad"; el legado de Firestore usaba "publico".
        if ($visibilidad === 'comunidad' || $visibilidad === 'publico') {
            return true;
        }
        // Fallback: publicado sin campo de visibilidad y con versión publicada.
        return is_string($campos['version_publicada_id'] ?? null)
            && ($campos['version_publicada_id'] ?? '') !== '';
    }

    /** @param array<string, mixed> $campos */
    private function esCuentoDelUsuario(array $campos, Usuario $usuario, string $uid): bool
    {
        if (($campos['autor_uid'] ?? null) === $uid) {
            return true;
        }
        // Esquema legado: id_alumno (entero) coincide con el id del usuario.
        return (int) ($campos['id_alumno'] ?? 0) === (int) $usuario->id;
    }

    /** @param array<string, mixed> $campos */
    private function tienePaginasLegado(array $campos): bool
    {
        return isset($campos['paginas']) && is_array($campos['paginas']) && $campos['paginas'] !== [];
    }

    /**
     * @param  array<string, mixed>  $campos
     * @return array<string, mixed>
     */
    private function versionLegado(string $cuentoId, array $campos): array
    {
        $paginas = $this->paginasLegado($cuentoId, $campos);
        $contenido = (string) ($campos['contenido'] ?? '');
        $autorUid = (string) ($campos['autor_uid'] ?? 'legacy-'.($campos['id_alumno'] ?? ''));

        return [
            'id' => 'legado-v1',
            'cuento_id' => $cuentoId,
            'autor_uid' => $autorUid,
            'titulo' => (string) ($campos['titulo'] ?? 'Historia sin título'),
            'sinopsis' => (string) ($campos['descripcion'] ?? mb_substr($contenido, 0, 200)),
            'categoria' => (string) ($campos['categoria'] ?? 'Sin clasificar'),
            'rango_edad' => (string) ($campos['rango_edad'] ?? ''),
            'portada_ref' => $campos['portada'] ?? ($campos['img_1'] ?? null),
            'paginas' => count($paginas),
            'idioma' => 'es-PE',
            'palabras' => (int) ($campos['palabras'] ?? 0),
            'tiempo_lectura' => (int) ($campos['tiempo_lectura'] ?? max(1, count($paginas))),
            'revision' => 0,
            'created_at_ms' => $this->timestampValor($campos['fecha_creacion'] ?? null),
            'updated_at_ms' => $this->timestampValor($campos['fecha_creacion'] ?? null),
            'schema_version' => 2,
        ];
    }

    /**
     * @param  array<string, mixed>  $campos
     * @return list<array<string, mixed>>
     */
    private function paginasLegado(string $cuentoId, array $campos): array
    {
        $embebidas = $campos['paginas'] ?? [];
        if (! is_array($embebidas)) {
            return [];
        }

        $resultado = [];
        foreach (array_values($embebidas) as $indice => $pagina) {
            if (! is_array($pagina)) {
                continue;
            }
            $resultado[] = [
                'id' => (string) ($pagina['id'] ?? ('page-'.($indice + 1))),
                'cuento_id' => $cuentoId,
                'version_id' => 'legado-v1',
                'orden' => $indice + 1,
                'contenido' => (string) ($pagina['contenido'] ?? ''),
                'ilustracion_ref' => $pagina['ilustracion'] ?? null,
                'texto_alternativo' => '',
                'fondo_token' => (string) ($pagina['colorFondo'] ?? 'var(--daemon-surface)'),
                'created_at_ms' => $this->timestampValor($campos['fecha_creacion'] ?? null),
                'updated_at_ms' => $this->timestampValor($campos['fecha_creacion'] ?? null),
                'schema_version' => 2,
            ];
        }

        return $resultado;
    }

    /**
     * @param  array{name: string, fields: array<string, mixed>, updateTime: string}  $documento
     * @return array<string, mixed>
     */
    private function cuentoPublico(array $documento): array
    {
        $campos = $documento['fields'];
        $id = basename((string) $documento['name']);
        $esLegado = (int) ($campos['schema_version'] ?? 0) !== 2;

        if ($esLegado) {
            return $this->cuentoPublicoLegado($id, $campos);
        }

        $versionId = $campos['version_publicada_id'] ?? null;
        $titulo = $campos['titulo_publicado'] ?? '';
        $sinopsis = $campos['sinopsis_publicada'] ?? '';

        // Enriquecer desde la versión publicada si falta la copia en cabecera.
        if (is_string($versionId) && $versionId !== '' && ($titulo === '' || $sinopsis === '')) {
            $version = $this->documentos->obtener($this->versionPath($id, $versionId));
            if ($version !== null) {
                $titulo = (string) ($version['fields']['titulo'] ?? $titulo);
                $sinopsis = (string) ($version['fields']['sinopsis'] ?? $sinopsis);
            }
        }

        return [
            'id' => $id,
            'autor_uid' => $campos['autor_uid'] ?? '',
            'autor_usuario_id' => $campos['autor_usuario_id'] ?? null,
            'autor_perfil' => $campos['autor_perfil'] ?? null,
            'titulo' => (string) $titulo,
            'descripcion' => (string) $sinopsis,
            'portada_ref' => $campos['portada_ref'] ?? null,
            'categoria' => (string) ($campos['categoria_publicada'] ?? 'Sin clasificar'),
            'rango_edad' => (string) ($campos['rango_edad_publicado'] ?? ''),
            'paginas_borrador' => (int) ($campos['paginas_publicadas'] ?? 0),
            'palabras' => (int) ($campos['palabras_publicadas'] ?? 0),
            'estado' => (string) ($campos['estado'] ?? 'borrador'),
            'visibilidad' => (string) ($campos['visibilidad'] ?? 'privado'),
            'audiencia' => (string) ($campos['audiencia'] ?? 'KIDS'),
            'moderacion' => (string) ($campos['moderacion_estado'] ?? 'no_solicitada'),
            'estadisticas' => $campos['stats'] ?? ['comentarios' => 0, 'reacciones' => 0, 'lecturas' => 0],
            'version_borrador_id' => (string) ($campos['version_borrador_id'] ?? ''),
            'version_publicada_id' => $versionId,
            'created_at_ms' => $this->timestampValor($campos['created_at'] ?? null),
            'updated_at_ms' => $this->timestampValor($campos['updated_at'] ?? null),
            'published_at_ms' => $this->timestampValor($campos['published_at'] ?? null),
            'schema_version' => 2,
        ];
    }

    /**
     * Cuento del esquema legado de Firestore: campos directos en la cabecera
     * (titulo, portada, autor, avatar, reacciones_count, paginas embebidas).
     *
     * @param  array<string, mixed>  $campos
     * @return array<string, mixed>
     */
    private function cuentoPublicoLegado(string $id, array $campos): array
    {
        $paginas = $campos['paginas'] ?? [];
        $cantidadPaginas = is_array($paginas) ? count($paginas) : 0;
        $timestamp = $this->timestampValor($campos['fecha_creacion'] ?? null);
        $visibilidad = (string) ($campos['visibilidad'] ?? 'comunidad');

        return [
            'id' => $id,
            'autor_uid' => (string) ($campos['autor_uid'] ?? 'legacy-'.($campos['id_alumno'] ?? '')),
            'autor_usuario_id' => isset($campos['id_alumno']) ? (int) $campos['id_alumno'] : null,
            'autor_perfil' => [
                'nombre' => (string) ($campos['autor'] ?? 'Autor DAEMON'),
                'avatar_ref' => $campos['avatar'] ?? null,
            ],
            'titulo' => (string) ($campos['titulo'] ?? 'Historia sin título'),
            'descripcion' => (string) ($campos['descripcion'] ?? mb_substr((string) ($campos['contenido'] ?? ''), 0, 200)),
            'portada_ref' => $campos['portada'] ?? ($campos['img_1'] ?? null),
            'categoria' => (string) ($campos['categoria'] ?? 'Sin clasificar'),
            'rango_edad' => (string) ($campos['rango_edad'] ?? ''),
            'paginas_borrador' => $cantidadPaginas,
            'palabras' => (int) ($campos['palabras'] ?? 0),
            'estado' => (string) ($campos['estado'] ?? 'publicado'),
            'visibilidad' => $visibilidad === 'publico' ? 'comunidad' : $visibilidad,
            'audiencia' => (string) ($campos['audiencia'] ?? 'KIDS'),
            'moderacion' => 'aprobado',
            'estadisticas' => [
                'comentarios' => 0,
                'reacciones' => (int) ($campos['reacciones_count'] ?? 0),
                'lecturas' => 0,
            ],
            'version_borrador_id' => '',
            'version_publicada_id' => null,
            'created_at_ms' => $timestamp,
            'updated_at_ms' => $timestamp,
            'published_at_ms' => $timestamp,
            'schema_version' => 2,
        ];
    }

    /**
     * @param  array{name: string, fields: array<string, mixed>, updateTime: string}  $documento
     * @return array<string, mixed>
     */
    private function cuentoCompleto(array $documento, Usuario $usuario): array
    {
        $campos = $documento['fields'];
        $id = basename((string) $documento['name']);
        $versionId = (string) ($campos['version_borrador_id'] ?? '');
        $cuento = $this->cuentoPublico($documento);

        if ($versionId !== '') {
            $version = $this->documentos->obtener($this->versionPath($id, $versionId));
            if ($version !== null) {
                $camposVersion = $version['fields'];
                $cuento['titulo'] = (string) ($camposVersion['titulo'] ?? $cuento['titulo']);
                $cuento['descripcion'] = (string) ($camposVersion['sinopsis'] ?? $cuento['descripcion']);
                $cuento['portada_ref'] = $camposVersion['portada_ref'] ?? $cuento['portada_ref'];
                $cuento['categoria'] = (string) ($camposVersion['categoria'] ?? $cuento['categoria']);
                $cuento['rango_edad'] = (string) ($camposVersion['rango_edad'] ?? $cuento['rango_edad']);
                $cuento['paginas_borrador'] = (int) ($camposVersion['paginas'] ?? $cuento['paginas_borrador']);
                $cuento['palabras'] = (int) ($camposVersion['palabras'] ?? $cuento['palabras']);
                $cuento['version_detalle'] = $this->versionPublica($id, $versionId, $camposVersion);
            }
        }

        return $cuento;
    }

    /**
     * @param  array<string, mixed>  $campos
     * @return array<string, mixed>
     */
    private function versionPublica(string $cuentoId, string $versionId, array $campos): array
    {
        return [
            'id' => $versionId,
            'cuento_id' => $cuentoId,
            'autor_uid' => $campos['autor_uid'] ?? '',
            'titulo' => (string) ($campos['titulo'] ?? ''),
            'sinopsis' => (string) ($campos['sinopsis'] ?? ''),
            'categoria' => (string) ($campos['categoria'] ?? ''),
            'rango_edad' => (string) ($campos['rango_edad'] ?? ''),
            'portada_ref' => $campos['portada_ref'] ?? null,
            'paginas' => (int) ($campos['paginas'] ?? 0),
            'idioma' => (string) ($campos['idioma'] ?? 'es-PE'),
            'palabras' => (int) ($campos['palabras'] ?? 0),
            'tiempo_lectura' => (int) ($campos['tiempo_lectura'] ?? 0),
            'revision' => (int) ($campos['revision'] ?? 0),
            'created_at_ms' => $this->timestampValor($campos['created_at'] ?? null),
            'updated_at_ms' => $this->timestampValor($campos['updated_at'] ?? null),
            'schema_version' => 2,
        ];
    }

    /** @return list<array<string, mixed>> */
    private function paginasDeVersion(string $cuentoId, string $versionId): array
    {
        $documentos = $this->documentos->listar(
            $this->cuentoPath($cuentoId).'/versiones/'.$this->idSeguro($versionId).'/paginas',
            [],
            ['orden', 'ASC'],
            100,
        );

        return collect($documentos)->map(function (array $documento) use ($cuentoId, $versionId): array {
            $campos = $documento['fields'];

            return [
                'id' => basename((string) $documento['name']),
                'cuento_id' => $cuentoId,
                'version_id' => $versionId,
                'orden' => (int) ($campos['orden'] ?? 1),
                'contenido' => (string) ($campos['contenido'] ?? ''),
                'ilustracion_ref' => $campos['ilustracion_ref'] ?? null,
                'texto_alternativo' => (string) ($campos['texto_alternativo'] ?? ''),
                'fondo_token' => (string) ($campos['fondo_token'] ?? 'var(--daemon-surface)'),
                'created_at_ms' => $this->timestampValor($campos['created_at'] ?? null),
                'updated_at_ms' => $this->timestampValor($campos['updated_at'] ?? null),
                'schema_version' => 2,
            ];
        })->all();
    }

    /**
     * @param  array{name: string, fields: array<string, mixed>, updateTime: string}  $documento
     * @return array<string, mixed>
     */
    private function comentarioPublico(string $cuentoId, array $documento): array
    {
        $campos = $documento['fields'];

        return [
            'id' => basename((string) $documento['name']),
            'cuento_id' => $cuentoId,
            'autor_uid' => (string) ($campos['autor_uid'] ?? ''),
            'cuerpo' => (string) ($campos['cuerpo'] ?? ''),
            'estado' => (string) ($campos['estado'] ?? 'visible'),
            'created_at_ms' => $this->timestampValor($campos['created_at'] ?? null),
            'updated_at_ms' => $this->timestampValor($campos['updated_at'] ?? null),
            'schema_version' => 2,
        ];
    }

    private function audiencia(Usuario $usuario): string
    {
        $nivel = strtoupper((string) $usuario->nivel);

        return $nivel === 'TEENS' ? 'TEENS' : 'KIDS';
    }

    private function timestampValor(mixed $valor): ?int
    {
        if (! is_string($valor) || $valor === '') {
            return null;
        }

        try {
            return CarbonImmutable::parse($valor)->getTimestampMs();
        } catch (Throwable) {
            return null;
        }
    }
}
