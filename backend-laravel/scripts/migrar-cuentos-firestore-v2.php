<?php

declare(strict_types=1);

/**
 * Migración one-shot: transforma los cuentos publicados de Firestore del
 * esquema antiguo (raíz plana con `paginas` en array, `visibilidad: publico`)
 * al esquema v2 que leen las reglas y el frontend directo:
 *   cuentos/{id}           -> raíz validada (schema_version 2, publicado,
 *                             aprobado, comunidad, snapshot de la versión)
 *   cuentos/{id}/versiones/{v}     -> versión publicada
 *   cuentos/{id}/versiones/{v}/paginas/{p} -> páginas en subcolección
 *
 * Uso (SIEMPRE dry-run primero):
 *   php scripts/migrar-cuentos-firestore-v2.php --dry-run
 *   php scripts/migrar-cuentos-firestore-v2.php --run
 *
 * Idempotente: omite documentos que ya tienen schema_version 2 y
 * moderacion_estado (contrato v2).
 */

use App\Services\Auth\GoogleServiceAccountTokenService;
use Illuminate\Support\Facades\Http;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$ejecutar = in_array('--run', $argv, true);
if (! $ejecutar && ! in_array('--dry-run', $argv, true)) {
    fwrite(STDERR, "Uso: php scripts/migrar-cuentos-firestore-v2.php [--dry-run|--run]\n");
    exit(2);
}

$google = new GoogleServiceAccountTokenService();
$proyecto = (string) config('services.firebase.project_id');
$base = "https://firestore.googleapis.com/v1/projects/{$proyecto}/databases/(default)/documents";

function peticion(array $opciones, string $url): array
{
    $respuesta = Http::withToken($opciones['token'])->timeout(60)->asJson()->post($url, $opciones['body']);
    if (! $respuesta->successful()) {
        fwrite(STDERR, 'HTTP '.$respuesta->status().': '.substr($respuesta->body(), 0, 600)."\n");
        throw new RuntimeException('Firestore rechazó la operación.');
    }

    return $respuesta->json() ?? [];
}

/** @return list<array{name: string, fields: array<string, mixed>}> */
function listarCuentosPublicados(string $base, string $token): array
{
    $filas = peticion(['token' => $token, 'body' => [
        'structuredQuery' => [
            'from' => [['collectionId' => 'cuentos']],
            'limit' => 100,
        ],
    ]], "{$base}:runQuery");

    $documentos = [];
    foreach ($filas as $fila) {
        $doc = $fila['document'] ?? null;
        if ($doc === null) {
            continue;
        }
        $campos = $doc['fields'] ?? [];
        $estado = $campos['estado']['stringValue'] ?? '';
        $schema = $campos['schema_version']['integerValue'] ?? null;
        $nuevoContrato = (int) $schema === 2 && isset($campos['moderacion_estado']);
        if ($estado === 'publicado' && ! $nuevoContrato) {
            $documentos[] = $doc;
        }
    }

    return $documentos;
}

/** @param array<string, mixed> $campos */
function codificar(array $campos): array
{
    $codificados = [];
    foreach ($campos as $campo => $valor) {
        if ($valor === null) {
            $codificados[$campo] = ['nullValue' => null];
        } elseif (is_bool($valor)) {
            $codificados[$campo] = ['booleanValue' => $valor];
        } elseif (is_int($valor)) {
            $codificados[$campo] = ['integerValue' => (string) $valor];
        } elseif (is_float($valor)) {
            $codificados[$campo] = ['doubleValue' => $valor];
        } elseif (is_string($valor)) {
            $codificados[$campo] = ['stringValue' => $valor];
        } elseif (is_array($valor)) {
            $mapeados = [];
            foreach ($valor as $k => $v) {
                $mapeados[$k] = codificar([$k => $v])[$k];
            }
            $codificados[$campo] = ['mapValue' => ['fields' => $mapeados]];
        }
    }

    return $codificados;
}

function texto(?string $valor): string
{
    return trim((string) $valor);
}

function timestampIso(?string $valor): string
{
    $normalizado = $valor ?? '';
    if ($normalizado === '') {
        return gmdate('c');
    }
    if (! str_contains($normalizado, 'T')) {
        $normalizado = str_replace(' ', 'T', $normalizado);
    }
    if (! str_ends_with($normalizado, 'Z') && ! str_contains(substr($normalizado, 10), '+')) {
        $normalizado .= 'Z';
    }
    $fecha = DateTimeImmutable::createFromFormat(DateTimeInterface::RFC3339_EXTENDED, $normalizado);
    if ($fecha === false) {
        $fecha = new DateTimeImmutable($normalizado);
    }

    return $fecha->format('Y-m-d\TH:i:s.u\Z');
}

/** @return array{0: string, 1: string} */
function idDeDocumento(string $nombre): array
{
    $pos = strrpos($nombre, '/');
    $ruta = substr($nombre, 0, (int) $pos);
    $id = substr($nombre, (int) $pos + 1);

    return [$ruta, $id];
}

$token = $google->token();
$cuentos = listarCuentosPublicados($base, $token);
$total = count($cuentos);

fwrite(STDOUT, "Cuentos publicados con esquema antiguo a migrar: {$total}\n");
if ($total === 0) {
    exit(0);
}

$transformados = 0;
foreach ($cuentos as $doc) {
    $nombre = $doc['name'];
    [$rutaRaiz, $cuentoId] = idDeDocumento($nombre);
    $campos = $doc['fields'] ?? [];

    $titulo = texto($campos['titulo']['stringValue'] ?? null) ?: 'Historia sin título';
    $descripcion = texto($campos['descripcion']['stringValue'] ?? null);
    $categoria = texto($campos['categoria']['stringValue'] ?? null) ?: 'Sin clasificar';
    $rangoEdad = texto($campos['rango_edad']['stringValue'] ?? null);
    $portada = $campos['portada']['stringValue'] ?? ($campos['img_1']['stringValue'] ?? null);
    $portada = $portada === '' ? null : $portada;
    $palabras = max(0, (int) ($campos['palabras']['integerValue'] ?? 0));
    $tiempoLectura = max(1, (int) ($campos['tiempo_lectura']['integerValue'] ?? 1));
    $reacciones = max(0, (int) ($campos['reacciones_count']['integerValue'] ?? 0));
    $autorNombre = texto($campos['autor']['stringValue'] ?? null);
    $avatar = $campos['avatar']['stringValue'] ?? null;
    $avatar = $avatar === '' ? null : $avatar;
    $idAlumno = (int) ($campos['id_alumno']['integerValue'] ?? 0);
    $fechaIso = timestampIso($campos['fecha_creacion']['stringValue'] ?? null);

    $paginasViejas = $campos['paginas']['arrayValue']['values'] ?? [];
    $versionId = 'v1-'.$cuentoId;
    $autorUid = $idAlumno > 0 ? 'demo-'.$idAlumno : 'demo-'.$cuentoId;

    $paginas = [];
    foreach ($paginasViejas as $indice => $pagina) {
        $paginaCampos = $pagina['mapValue']['fields'] ?? [];
        $contenido = (string) ($paginaCampos['contenido']['stringValue'] ?? '');
        if (trim($contenido) === '') {
            continue;
        }
        $ilustracion = $paginaCampos['ilustracion']['stringValue'] ?? null;
        $fondo = $paginaCampos['colorFondo']['stringValue'] ?? null;
        $idPagina = (string) ($paginaCampos['id']['stringValue'] ?? 'pagina-'.($indice + 1));
        $paginas[] = [
            'id' => $idPagina,
            'contenido' => $contenido,
            'ilustracion' => $ilustracion === '' ? null : $ilustracion,
            'fondo' => $fondo,
        ];
    }
    if ($paginas === []) {
        $paginas[] = [
            'id' => 'pagina-1',
            'contenido' => $contenido = (string) ($campos['data_1']['stringValue'] ?? ''),
            'ilustracion' => $portada,
            'fondo' => null,
        ];
    }

    fwrite(STDOUT, "  - {$cuentoId}: '{$titulo}' (".count($paginas)." páginas, {$reacciones} reacciones)\n");

    if (! $ejecutar) {
        continue;
    }

    // 1) Eliminar la raíz antigua (precondición updateTime) y 2) recrearla
    // con el contrato v2 junto a versión y páginas, en un mismo commit.
    $writes = [
        ['delete' => $nombre, 'currentDocument' => ['updateTime' => $doc['updateTime']]],
        [
            'update' => [
                'name' => $nombre,
                'fields' => codificar([
                    'schema_version' => 2,
                    'autor_uid' => $autorUid,
                    'autor_usuario_id' => $idAlumno > 0 ? $idAlumno : null,
                    'autor_perfil' => ($autorNombre !== '' || $avatar !== null) ? [
                        'nombre' => $autorNombre !== '' ? mb_substr($autorNombre, 0, 80) : 'Autor DAEMON',
                        'avatar_ref' => $avatar,
                    ] : null,
                    'audiencia' => 'TEENS',
                    'estado' => 'publicado',
                    'visibilidad' => 'comunidad',
                    'version_borrador_id' => $versionId,
                    'version_publicada_id' => $versionId,
                    'moderacion_estado' => 'aprobado',
                    'titulo_publicado' => mb_substr($titulo, 0, 120),
                    'sinopsis_publicada' => mb_substr($descripcion, 0, 500),
                    'categoria_publicada' => mb_substr($categoria, 0, 50),
                    'rango_edad_publicado' => mb_substr($rangoEdad, 0, 30),
                    'paginas_publicadas' => count($paginas),
                    'palabras_publicadas' => $palabras,
                    'portada_ref' => $portada,
                    'stats' => ['comentarios' => 0, 'reacciones' => $reacciones, 'lecturas' => 0],
                    'comentarios_bloqueados' => false,
                    'created_at' => $fechaIso,
                    'updated_at' => $fechaIso,
                    'submitted_at' => $fechaIso,
                    'published_at' => $fechaIso,
                ]),
            ],
            'updateMask' => ['fieldPaths' => [
                'schema_version', 'autor_uid', 'autor_usuario_id', 'autor_perfil', 'audiencia',
                'estado', 'visibilidad', 'version_borrador_id', 'version_publicada_id',
                'moderacion_estado', 'titulo_publicado', 'sinopsis_publicada',
                'categoria_publicada', 'rango_edad_publicado', 'paginas_publicadas',
                'palabras_publicadas', 'portada_ref', 'stats', 'comentarios_bloqueados',
                'created_at', 'updated_at', 'submitted_at', 'published_at',
            ]],
            'currentDocument' => ['exists' => false],
        ],
    ];

    $versionRuta = "{$nombre}/versiones/{$versionId}";
    $writes[] = [
        'update' => [
            'name' => $versionRuta,
            'fields' => codificar([
                'schema_version' => 2,
                'autor_uid' => $autorUid,
                'estado' => 'publicada',
                'titulo' => mb_substr($titulo, 0, 120),
                'sinopsis' => mb_substr($descripcion, 0, 500),
                'categoria' => mb_substr($categoria, 0, 50),
                'rango_edad' => mb_substr($rangoEdad, 0, 30),
                'portada_ref' => $portada,
                'paginas' => count($paginas),
                'idioma' => 'es-PE',
                'palabras' => $palabras,
                'tiempo_lectura' => $tiempoLectura,
                'revision' => 0,
                'created_at' => $fechaIso,
                'updated_at' => $fechaIso,
            ]),
        ],
        'updateMask' => ['fieldPaths' => [
            'schema_version', 'autor_uid', 'estado', 'titulo', 'sinopsis', 'categoria',
            'rango_edad', 'portada_ref', 'paginas', 'idioma', 'palabras', 'tiempo_lectura',
            'revision', 'created_at', 'updated_at',
        ]],
        'currentDocument' => ['exists' => false],
    ];

    foreach ($paginas as $pagina) {
        $writes[] = [
            'update' => [
                'name' => "{$versionRuta}/paginas/{$pagina['id']}",
                'fields' => codificar([
                    'schema_version' => 2,
                    'autor_uid' => $autorUid,
                    'orden' => (int) array_search($pagina['id'], array_column($paginas, 'id'), true) + 1,
                    'contenido' => $pagina['contenido'],
                    'ilustracion_ref' => $pagina['ilustracion'],
                    'texto_alternativo' => '',
                    'fondo_token' => $pagina['fondo'] ?? 'var(--daemon-surface)',
                    'created_at' => $fechaIso,
                    'updated_at' => $fechaIso,
                ]),
            ],
            'updateMask' => ['fieldPaths' => [
                'schema_version', 'autor_uid', 'orden', 'contenido', 'ilustracion_ref',
                'texto_alternativo', 'fondo_token', 'created_at', 'updated_at',
            ]],
            'currentDocument' => ['exists' => false],
        ];
    }

    peticion(['token' => $token, 'body' => ['writes' => $writes]], $base.':commit');
    $transformados++;
    fwrite(STDOUT, "    -> migrado\n");
}

fwrite(STDOUT, ($ejecutar ? 'Migrados' : 'Dry-run: se migrarían').": {$transformados} de {$total} cuentos.\n");
