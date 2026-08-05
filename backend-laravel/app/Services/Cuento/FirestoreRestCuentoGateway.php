<?php

namespace App\Services\Cuento;

use App\Contracts\Cuento\CuentoDocumentoGateway;
use App\Exceptions\CuentoV2Exception;
use App\Services\Auth\GoogleServiceAccountTokenService;
use GuzzleHttp\Client as GuzzleClient;
use Throwable;

class FirestoreRestCuentoGateway implements CuentoDocumentoGateway
{
    public function __construct(
        private readonly GoogleServiceAccountTokenService $google,
        private readonly ?GuzzleClient $clienteHttp = null,
    ) {}

    /**
     * Un único cliente Guzzle compartido: Laravel Http() crea un cliente
     * nuevo por llamada (conexión TLS nueva cada vez, ~1 s desde Render a
     * Google). Reutilizando el cliente, Guzzle reusa las conexiones y las
     * operaciones con varias llamadas (guardar borrador ~6) bajan de 12 s
     * a ~2 s.
     */
    private function clienteHttp(): GuzzleClient
    {
        return $this->clienteHttp ?? new GuzzleClient([
            'timeout' => 20,
            'connect_timeout' => 5,
            'curl' => [CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4],
        ]);
    }

    /**
     * @param  array<string, mixed>  $datos
     * @return array{estado: int, cuerpo: string}
     */
    private function peticion(string $metodo, string $url, array $datos = []): array
    {
        $opciones = [
            'headers' => ['Authorization' => 'Bearer '.$this->google->token()],
        ];
        if ($datos !== []) {
            $opciones['json'] = $datos;
        }
        $respuesta = $this->clienteHttp()->request($metodo, $url, $opciones);

        return [
            'estado' => $respuesta->getStatusCode(),
            'cuerpo' => (string) $respuesta->getBody(),
        ];
    }

    public function obtener(string $ruta): ?array
    {
        try {
            $respuesta = $this->peticion('GET', $this->documentoUrl($ruta));
        } catch (Throwable $exception) {
            throw new CuentoV2Exception(
                'No se pudo contactar al almacén de cuentos.',
                503,
                'FIRESTORE_NO_DISPONIBLE',
            );
        }

        if ($respuesta['estado'] === 404) {
            return null;
        }
        $this->asegurarRespuesta($respuesta['estado']);

        return $this->decodificarDocumento(json_decode($respuesta['cuerpo'], true));
    }

    public function actualizar(
        string $ruta,
        array $campos,
        array $timestampsServidor,
        string $updateTime,
    ): array {
        return $this->commit($ruta, $campos, $timestampsServidor, ['updateTime' => $updateTime]);
    }

    public function crear(string $ruta, array $campos, array $timestampsServidor): array
    {
        return $this->commit($ruta, $campos, $timestampsServidor, ['exists' => false]);
    }

    public function eliminar(string $ruta, string $updateTime): void
    {
        $this->enviarCommit([[
            'delete' => $this->documentoNombre($ruta),
            'currentDocument' => ['updateTime' => $updateTime],
        ]]);
    }

    public function contar(string $rutaColeccion, array $filtrosIgualdad = []): int
    {
        [$rutaPadre, $coleccion] = $this->separarColeccion($rutaColeccion);
        $consulta = ['from' => [['collectionId' => $coleccion]]];
        $filtros = collect($filtrosIgualdad)
            ->map(fn (mixed $valor, string $campo): array => [
                'fieldFilter' => [
                    'field' => ['fieldPath' => $campo],
                    'op' => 'EQUAL',
                    'value' => $this->codificarValor($valor),
                ],
            ])
            ->values()
            ->all();
        if (count($filtros) === 1) {
            $consulta['where'] = $filtros[0];
        } elseif (count($filtros) > 1) {
            $consulta['where'] = ['compositeFilter' => ['op' => 'AND', 'filters' => $filtros]];
        }

        try {
            $respuesta = $this->peticion('POST', $this->agregacionUrl($rutaPadre), [
                'structuredAggregationQuery' => [
                    'aggregations' => [['alias' => 'total', 'count' => new \stdClass]],
                    'structuredQuery' => $consulta,
                ],
            ]);
        } catch (Throwable $exception) {
            throw new CuentoV2Exception('No se pudo consultar Firestore.', 503, 'FIRESTORE_NO_DISPONIBLE');
        }
        $this->asegurarRespuesta($respuesta['estado']);
        foreach ($this->decodificarFilas($respuesta['cuerpo']) as $fila) {
            $valor = $fila['result']['aggregateFields']['total']['integerValue'] ?? null;
            if (is_numeric($valor)) {
                return (int) $valor;
            }
        }

        throw new CuentoV2Exception('Firestore devolviÃ³ un agregado invÃ¡lido.', 502, 'RESPUESTA_FIRESTORE_INVALIDA');
    }

    /**
     * Ejecuta una consulta sobre una colección y devuelve los documentos
     * (mismo formato que obtener). Sólo soporta filtros de igualdad y un
     * campo de orden; suficiente para la galería y los cuentos propios.
     *
     * @param  array<string, scalar|null>  $filtrosIgualdad
     * @param  array{0: string, 1: string}|null  $orden  [campo, ASC|DESC]
     * @return list<array{name: string, fields: array<string, mixed>, updateTime: string}>
     */
    public function listar(
        string $rutaColeccion,
        array $filtrosIgualdad = [],
        ?array $orden = null,
        int $limite = 30,
    ): array {
        [$rutaPadre, $coleccion] = $this->separarColeccion($rutaColeccion);
        $consulta = ['from' => [['collectionId' => $coleccion]]];
        $filtros = collect($filtrosIgualdad)
            ->map(fn (mixed $valor, string $campo): array => [
                'fieldFilter' => [
                    'field' => ['fieldPath' => $campo],
                    'op' => 'EQUAL',
                    'value' => $this->codificarValor($valor),
                ],
            ])
            ->values()
            ->all();
        if (count($filtros) === 1) {
            $consulta['where'] = $filtros[0];
        } elseif (count($filtros) > 1) {
            $consulta['where'] = ['compositeFilter' => ['op' => 'AND', 'filters' => $filtros]];
        }
        if ($orden !== null) {
            $consulta['orderBy'] = [[
                'field' => ['fieldPath' => $orden[0]],
                'direction' => strtoupper($orden[1]) === 'DESC' ? 'DESCENDING' : 'ASCENDING',
            ]];
        }
        $consulta['limit'] = max(1, min($limite, 50));

        try {
            $respuesta = $this->peticion('POST', $this->runQueryUrl($rutaPadre), ['structuredQuery' => $consulta]);
        } catch (Throwable $exception) {
            throw new CuentoV2Exception('No se pudo consultar Firestore.', 503, 'FIRESTORE_NO_DISPONIBLE');
        }
        $this->asegurarRespuesta($respuesta['estado']);

        $documentos = [];
        foreach ($this->decodificarFilas($respuesta['cuerpo']) as $fila) {
            if (isset($fila['document']) && is_array($fila['document'])) {
                $documentos[] = $this->decodificarDocumento($fila['document']);
            }
        }

        return $documentos;
    }

    /**
     * Decodifica el cuerpo de una respuesta de Firestore en una lista de
     * filas. Firestore puede responder como NDJSON (una fila por línea) o
     * como un JSON array completo indentado; este método acepta ambos.
     *
     * @return list<array<string, mixed>>
     */
    private function decodificarFilas(string $cuerpo): array
    {
        $json = json_decode($cuerpo, true);
        if (is_array($json)) {
            // JSON array completo ([{...}, {...}]) o un único objeto
            // (NDJSON de una sola línea como la agregación).
            return array_is_list($json) ? $json : [$json];
        }

        $filas = [];
        $lineas = preg_split('/\r?\n/', trim($cuerpo)) ?: [];
        foreach ($lineas as $linea) {
            if (trim($linea) === '') {
                continue;
            }
            $fila = json_decode($linea, true);
            if (is_array($fila)) {
                $filas[] = $fila;
            }
        }

        return $filas;
    }

    /**
     * @param  array<string, mixed>  $campos
     * @param  list<string>  $timestampsServidor
     * @param  array{updateTime?: string, exists?: bool}  $precondicion
     * @return array{name: string, fields: array<string, mixed>, updateTime: string}
     */
    private function commit(
        string $ruta,
        array $campos,
        array $timestampsServidor,
        array $precondicion,
    ): array {
        $nombre = $this->documentoNombre($ruta);
        $write = [
            'update' => [
                'name' => $nombre,
                'fields' => $this->codificarCampos($campos),
            ],
            'updateMask' => ['fieldPaths' => array_keys($campos)],
            'currentDocument' => $precondicion,
        ];
        if ($timestampsServidor !== []) {
            $write['updateTransforms'] = array_map(
                fn (string $campo): array => [
                    'fieldPath' => $campo,
                    'setToServerValue' => 'REQUEST_TIME',
                ],
                $timestampsServidor,
            );
        }

        try {
            $respuesta = $this->peticion('POST', $this->commitUrl(), ['writes' => [$write]]);
        } catch (Throwable $exception) {
            throw new CuentoV2Exception(
                'No se pudo contactar al almacén de cuentos.',
                503,
                'FIRESTORE_NO_DISPONIBLE',
            );
        }

        if ($respuesta['estado'] === 409 || $respuesta['estado'] === 412) {
            throw new CuentoV2Exception(
                'El cuento cambió mientras se procesaba la operación. Inténtalo nuevamente.',
                409,
                'CONFLICTO_FIRESTORE',
            );
        }
        $this->asegurarRespuesta($respuesta['estado']);

        $documento = $this->obtener($ruta);
        if ($documento === null) {
            throw new CuentoV2Exception('Firestore no confirmó el documento escrito.', 503, 'FIRESTORE_INCONSISTENTE');
        }

        return $documento;
    }

    /** @param list<array<string, mixed>> $writes */
    private function enviarCommit(array $writes): void
    {
        try {
            $respuesta = $this->peticion('POST', $this->commitUrl(), ['writes' => $writes]);
        } catch (Throwable $exception) {
            throw new CuentoV2Exception('No se pudo contactar a Firestore.', 503, 'FIRESTORE_NO_DISPONIBLE');
        }
        if ($respuesta['estado'] === 409 || $respuesta['estado'] === 412) {
            throw new CuentoV2Exception(
                'El documento cambiÃ³ mientras se procesaba la operaciÃ³n.',
                409,
                'CONFLICTO_FIRESTORE',
            );
        }
        $this->asegurarRespuesta($respuesta['estado']);
    }

    private function asegurarRespuesta(int $estado): void
    {
        if ($estado >= 200 && $estado < 300) {
            return;
        }

        throw new CuentoV2Exception(
            $estado === 403
                ? 'La credencial del servidor no puede operar sobre Firestore.'
                : 'Firestore rechazó la operación solicitada.',
            $estado === 403 ? 503 : 502,
            'FIRESTORE_RECHAZO',
        );
    }

    private function proyecto(): string
    {
        $proyecto = trim((string) config('services.firebase.project_id', ''));
        if ($proyecto === '') {
            throw new CuentoV2Exception('Firebase no está configurado en el backend.', 503, 'FIREBASE_NO_CONFIGURADO');
        }

        return $proyecto;
    }

    private function baseNombre(): string
    {
        $database = (string) config('services.firebase.firestore_database', '(default)');

        return "projects/{$this->proyecto()}/databases/{$database}/documents";
    }

    private function documentoNombre(string $ruta): string
    {
        return $this->baseNombre().'/'.$this->normalizarRuta($ruta);
    }

    private function documentoUrl(string $ruta): string
    {
        return 'https://firestore.googleapis.com/v1/'.$this->documentoNombre($ruta);
    }

    private function commitUrl(): string
    {
        $database = (string) config('services.firebase.firestore_database', '(default)');

        return "https://firestore.googleapis.com/v1/projects/{$this->proyecto()}/databases/{$database}/documents:commit";
    }

    private function agregacionUrl(string $rutaPadre): string
    {
        $sufijo = $rutaPadre === '' ? '' : '/'.$rutaPadre;

        return 'https://firestore.googleapis.com/v1/'.$this->baseNombre().$sufijo.':runAggregationQuery';
    }

    private function runQueryUrl(string $rutaPadre): string
    {
        $sufijo = $rutaPadre === '' ? '' : '/'.$rutaPadre;

        return 'https://firestore.googleapis.com/v1/'.$this->baseNombre().$sufijo.':runQuery';
    }

    /** @return array{0: string, 1: string} */
    private function separarColeccion(string $ruta): array
    {
        $segmentos = array_values(array_filter(explode('/', trim($ruta, '/')), fn (string $segmento) => $segmento !== ''));
        if (count($segmentos) % 2 !== 1) {
            throw new CuentoV2Exception('La ruta de colecciÃ³n no es vÃ¡lida.', 500, 'RUTA_FIRESTORE_INVALIDA');
        }
        foreach ($segmentos as $segmento) {
            if (! preg_match('/^[A-Za-z0-9_-]{1,128}$/', $segmento)) {
                throw new CuentoV2Exception('La ruta contiene un segmento invÃ¡lido.', 500, 'RUTA_FIRESTORE_INVALIDA');
            }
        }
        $coleccion = array_pop($segmentos);

        return [implode('/', $segmentos), $coleccion];
    }

    private function normalizarRuta(string $ruta): string
    {
        $segmentos = array_values(array_filter(explode('/', trim($ruta, '/')), fn (string $segmento) => $segmento !== ''));
        if ($segmentos === [] || count($segmentos) % 2 !== 0) {
            throw new CuentoV2Exception('La ruta de Firestore no es válida.', 500, 'RUTA_FIRESTORE_INVALIDA');
        }
        foreach ($segmentos as $segmento) {
            if (! preg_match('/^[A-Za-z0-9_-]{1,128}$/', $segmento)) {
                throw new CuentoV2Exception('La ruta de Firestore contiene un segmento inválido.', 500, 'RUTA_FIRESTORE_INVALIDA');
            }
        }

        return implode('/', $segmentos);
    }

    /**
     * @param  array<string, mixed>  $campos
     * @return array<string, array<string, mixed>>
     */
    private function codificarCampos(array $campos): array
    {
        return collect($campos)
            ->mapWithKeys(fn (mixed $valor, string $campo): array => [$campo => $this->codificarValor($valor)])
            ->all();
    }

    /** @return array<string, mixed> */
    private function codificarValor(mixed $valor): array
    {
        if ($valor === null) {
            return ['nullValue' => null];
        }
        if (is_bool($valor)) {
            return ['booleanValue' => $valor];
        }
        if (is_int($valor)) {
            return ['integerValue' => (string) $valor];
        }
        if (is_float($valor)) {
            return ['doubleValue' => $valor];
        }
        if (is_string($valor)) {
            return ['stringValue' => $valor];
        }
        if (is_array($valor) && array_is_list($valor)) {
            return ['arrayValue' => ['values' => array_map(fn (mixed $item) => $this->codificarValor($item), $valor)]];
        }
        if (is_array($valor)) {
            return ['mapValue' => ['fields' => $this->codificarCampos($valor)]];
        }

        throw new CuentoV2Exception('Un valor no se puede codificar para Firestore.', 500, 'VALOR_FIRESTORE_INVALIDO');
    }

    /**
     * @param  mixed  $respuesta
     * @return array{name: string, fields: array<string, mixed>, updateTime: string}
     */
    private function decodificarDocumento(mixed $respuesta): array
    {
        if (! is_array($respuesta)
            || ! is_string($respuesta['name'] ?? null)
            || ! is_array($respuesta['fields'] ?? null)
            || ! is_string($respuesta['updateTime'] ?? null)) {
            throw new CuentoV2Exception('Firestore devolvió un documento inválido.', 502, 'RESPUESTA_FIRESTORE_INVALIDA');
        }

        return [
            'name' => $respuesta['name'],
            'fields' => collect($respuesta['fields'])
                ->mapWithKeys(fn (mixed $valor, string $campo): array => [$campo => $this->decodificarValor($valor)])
                ->all(),
            'updateTime' => $respuesta['updateTime'],
        ];
    }

    private function decodificarValor(mixed $valor): mixed
    {
        if (! is_array($valor)) {
            throw new CuentoV2Exception('Firestore devolvió un valor inválido.', 502, 'RESPUESTA_FIRESTORE_INVALIDA');
        }
        foreach (['stringValue', 'booleanValue', 'doubleValue', 'timestampValue'] as $tipo) {
            if (array_key_exists($tipo, $valor)) {
                return $valor[$tipo];
            }
        }
        if (array_key_exists('integerValue', $valor)) {
            return (int) $valor['integerValue'];
        }
        if (array_key_exists('nullValue', $valor)) {
            return null;
        }
        if (isset($valor['mapValue']['fields']) && is_array($valor['mapValue']['fields'])) {
            return collect($valor['mapValue']['fields'])
                ->mapWithKeys(fn (mixed $item, string $campo): array => [$campo => $this->decodificarValor($item)])
                ->all();
        }
        if (isset($valor['arrayValue'])) {
            $valores = $valor['arrayValue']['values'] ?? [];

            return is_array($valores) ? array_map(fn (mixed $item) => $this->decodificarValor($item), $valores) : [];
        }

        throw new CuentoV2Exception('Firestore devolvió un tipo desconocido.', 502, 'RESPUESTA_FIRESTORE_INVALIDA');
    }
}
