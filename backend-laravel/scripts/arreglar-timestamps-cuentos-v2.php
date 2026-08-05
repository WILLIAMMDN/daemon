<?php

declare(strict_types=1);

/**
 * Reparación one-shot: la migración de cuentos al esquema v2 escribió los
 * campos temporales (created_at, updated_at, submitted_at, published_at)
 * como strings ISO (`stringValue`) en vez de timestamps de Firestore
 * (`timestampValue`). El converter del frontend exige `Timestamp` y la
 * galería fallaba con "Firestore devolvió datos inválidos en
 * cuentos/{id}.created_at".
 *
 * Convierte a timestampValue los campos temporales de:
 *   - la raíz del cuento (publicado, aprobado, comunidad, schema 2)
 *   - su versión publicada (versiones/{version_publicada_id})
 *   - las páginas de esa versión (versiones/{v}/paginas/{p})
 *
 * Uso:
 *   php scripts/arreglar-timestamps-cuentos-v2.php --dry-run
 *   php scripts/arreglar-timestamps-cuentos-v2.php --run
 *
 * Idempotente: omite documentos cuyos campos temporales ya son timestamps.
 */

use App\Services\Auth\GoogleServiceAccountTokenService;
use Illuminate\Support\Facades\Http;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$ejecutar = in_array('--run', $argv, true);
if (! $ejecutar && ! in_array('--dry-run', $argv, true)) {
    fwrite(STDERR, "Uso: php scripts/arreglar-timestamps-cuentos-v2.php [--dry-run|--run]\n");
    exit(2);
}

$google = new GoogleServiceAccountTokenService();
$proyecto = (string) config('services.firebase.project_id');
$base = "https://firestore.googleapis.com/v1/projects/{$proyecto}/databases/(default)/documents";

function peticion(array $opciones, string $url): array
{
    $respuesta = Http::withToken($opciones['token'])->timeout(60)->asJson()->post($url, $opciones['body']);
    if (! $respuesta->successful()) {
        fwrite(STDERR, 'HTTP '.$respuesta->status().': '.substr($respuesta->body(), 0, 500)."\n");
        throw new RuntimeException('Firestore rechazó la operación.');
    }

    return $respuesta->json() ?? [];
}

function peticionGet(array $opciones, string $url): array
{
    $respuesta = Http::withToken($opciones['token'])->timeout(60)->get($url);
    if (! $respuesta->successful()) {
        return [];
    }

    return $respuesta->json() ?? [];
}

/** Convierte un string ISO válido al valor REST timestampValue. */
function timestampValue(?string $iso): ?array
{
    $iso = trim((string) $iso);
    if ($iso === '') {
        return null;
    }
    // Firestore acepta RFC3339 (con o sin fracción y offset). Normaliza a Z.
    try {
        $fecha = new DateTimeImmutable($iso);
        $normalizado = $fecha->format('Y-m-d\TH:i:s').'.000Z';

        return ['timestampValue' => $normalizado];
    } catch (Throwable) {
        return null;
    }
}

function normalizarTemporales(array $campos, array $claves): array
{
    $patch = [];
    foreach ($claves as $clave) {
        $campo = $campos[$clave] ?? null;
        if ($campo === null) {
            continue;
        }
        // Solo tocar los que siguen como string (el bug de la migración).
        if (! isset($campo['stringValue'])) {
            continue;
        }
        $valor = timestampValue($campo['stringValue']);
        if ($valor !== null) {
            $patch[$clave] = $valor;
        }
    }

    return $patch;
}

$TEMPORALES_RAIZ = ['created_at', 'updated_at', 'submitted_at', 'published_at'];
$TEMPORALES_HIJO = ['created_at', 'updated_at'];

// 1) Listar raíces publicadas v2 migradas.
$filas = peticion(['token' => $google->token(), 'body' => [
    'structuredQuery' => [
        'from' => [['collectionId' => 'cuentos']],
        'limit' => 100,
    ],
]], "{$base}:runQuery");

$reparadas = 0;
$totales = 0;
foreach ($filas as $fila) {
    if (! isset($fila['document'])) {
        continue;
    }
    $doc = $fila['document'];
    $nombre = $doc['name'];
    $cuentoId = basename($nombre);
    $campos = $doc['fields'] ?? [];

    $esV2Publicado = (int) ($campos['schema_version']['integerValue'] ?? 0) === 2
        && ($campos['estado']['stringValue'] ?? '') === 'publicado'
        && isset($campos['version_publicada_id']);

    if (! $esV2Publicado) {
        continue;
    }

    $totales++;
    $versionId = $campos['version_publicada_id']['stringValue'] ?? '';
    $titulo = mb_substr($campos['titulo_publicado']['stringValue'] ?? '', 0, 45);

    // Parches por nivel.
    $raizPatch = normalizarTemporales($campos, $TEMPORALES_RAIZ);
    $versionPatch = [];
    $paginasPatch = [];
    $versionDoc = $versionId !== ''
        ? peticionGet(['token' => $google->token()], "{$base}/cuentos/{$cuentoId}/versiones/{$versionId}")
        : [];
    if ($versionDoc !== []) {
        $versionPatch = normalizarTemporales($versionDoc['fields'] ?? [], $TEMPORALES_HIJO);
        $paginas = peticionGet(['token' => $google->token()], "{$base}/cuentos/{$cuentoId}/versiones/{$versionId}/paginas");
        foreach (($paginas['documents'] ?? []) as $pagina) {
            $paginaId = basename($pagina['name']);
            $paginaPatch = normalizarTemporales($pagina['fields'] ?? [], $TEMPORALES_HIJO);
            if ($paginaPatch !== []) {
                $paginasPatch[$paginaId] = $paginaPatch;
            }
        }
    }

    $nivel = $raizPatch !== [] ? 1 : 0;
    $nivel += $versionPatch !== [] ? 1 : 0;
    $nivel += count($paginasPatch) > 0 ? count($paginasPatch) : 0;
    if ($nivel === 0) {
        continue;
    }

    fwrite(STDOUT, "  - {$cuentoId}: '{$titulo}' (raiz ".count($raizPatch).", version ".count($versionPatch).", paginas ".count($paginasPatch).")\n");

    if (! $ejecutar) {
        continue;
    }

    $writes = [];
    if ($raizPatch !== []) {
        $writes[] = [
            'update' => ['name' => $nombre, 'fields' => $raizPatch],
            'updateMask' => ['fieldPaths' => array_keys($raizPatch)],
            'currentDocument' => ['exists' => true],
        ];
    }
    $versionRuta = "{$nombre}/versiones/{$versionId}";
    if ($versionPatch !== [] && $versionId !== '') {
        $writes[] = [
            'update' => [
                'name' => $versionRuta,
                'fields' => $versionPatch,
            ],
            'updateMask' => ['fieldPaths' => array_keys($versionPatch)],
            'currentDocument' => ['exists' => true],
        ];
    }
    foreach ($paginasPatch as $paginaId => $patch) {
        $writes[] = [
            'update' => [
                'name' => "{$versionRuta}/paginas/{$paginaId}",
                'fields' => $patch,
            ],
            'updateMask' => ['fieldPaths' => array_keys($patch)],
            'currentDocument' => ['exists' => true],
        ];
    }

    if ($writes !== []) {
        // Los writes del batch usan rutas completas; los del update ya la traen.
        peticion(['token' => $google->token(), 'body' => ['writes' => $writes]], $base.':commit');
        $reparadas++;
    }
}

fwrite(STDOUT, ($ejecutar ? 'Reparados' : 'Dry-run: se repararían').": {$reparadas} de {$totales} cuentos v2 publicados.\n");
