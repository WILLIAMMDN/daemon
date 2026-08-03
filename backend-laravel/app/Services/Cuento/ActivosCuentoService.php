<?php

namespace App\Services\Cuento;

use App\Contracts\Cuento\CuentoDocumentoGateway;
use App\Exceptions\CuentoV2Exception;
use App\Models\Usuario;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ActivosCuentoService
{
    /** @var array<string, string> */
    private const EXTENSIONES = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
    ];

    public function __construct(private readonly CuentoDocumentoGateway $documentos) {}

    /** @return array{referencia: string, url_lectura: string, mime: string, bytes: int, ancho: int, alto: int} */
    public function subir(
        Usuario $usuario,
        string $cuentoId,
        UploadedFile $archivo,
        string $tipo,
        ?string $paginaId,
        string $idempotencia,
    ): array {
        $this->cuentoEditable($usuario, $cuentoId);
        $mime = (string) $archivo->getMimeType();
        $extension = self::EXTENSIONES[$mime] ?? null;
        $dimensiones = @getimagesize($archivo->getRealPath());
        if ($extension === null || $dimensiones === false) {
            throw new CuentoV2Exception('El archivo no es una imagen vÃ¡lida.', 422, 'ACTIVO_INVALIDO');
        }
        [$ancho, $alto] = $dimensiones;
        $maxDimension = (int) config('cuentos.activos_max_dimension', 4096);
        if ($ancho < 1 || $alto < 1 || $ancho > $maxDimension || $alto > $maxDimension) {
            throw new CuentoV2Exception('Las dimensiones de la imagen no estÃ¡n permitidas.', 422, 'DIMENSIONES_INVALIDAS');
        }
        $uidHash = substr(hash('sha256', $this->uid($usuario)), 0, 32);
        $assetId = substr(hash('sha256', $this->uid($usuario).'|'.$cuentoId.'|'.$idempotencia), 0, 40);
        $segmento = $tipo === 'portada'
            ? 'cover'
            : 'pages/'.$this->idSeguro((string) $paginaId);
        $ruta = 'cuentos/borradores/'.$uidHash.'/'.$this->idSeguro($cuentoId).'/'.$segmento.'/'.$assetId.'.'.$extension;
        $contenido = fopen($archivo->getRealPath(), 'rb');
        if ($contenido === false) {
            throw new CuentoV2Exception('No se pudo leer la imagen.', 422, 'ACTIVO_INVALIDO');
        }
        try {
            $guardado = Storage::disk($this->disk())->put($ruta, $contenido, [
                'ContentType' => $mime,
                'visibility' => 'private',
            ]);
        } finally {
            fclose($contenido);
        }
        if (! $guardado) {
            throw new CuentoV2Exception('No se pudo guardar la imagen.', 503, 'STORAGE_NO_DISPONIBLE');
        }
        $referencia = $this->referencia($ruta);

        return [
            'referencia' => $referencia,
            'url_lectura' => $this->urlTemporal($ruta),
            'mime' => $mime,
            'bytes' => (int) $archivo->getSize(),
            'ancho' => (int) $ancho,
            'alto' => (int) $alto,
        ];
    }

    public function urlLectura(Usuario $usuario, string $cuentoId, string $referencia): string
    {
        $this->cuentoLegible($usuario, $cuentoId);
        $ruta = $this->rutaDelCuento($cuentoId, $referencia);

        return $this->urlTemporal($ruta);
    }

    public function eliminar(Usuario $usuario, string $cuentoId, string $referencia): void
    {
        $this->cuentoEditable($usuario, $cuentoId);
        Storage::disk($this->disk())->delete($this->rutaPropia($usuario, $cuentoId, $referencia));
    }

    /** @return array{eliminados: int} */
    public function limpiar(Usuario $usuario, string $cuentoId, array $referencias): array
    {
        $this->cuentoEditable($usuario, $cuentoId);
        $eliminados = 0;
        foreach (array_unique($referencias) as $referencia) {
            $ruta = $this->rutaPropia($usuario, $cuentoId, (string) $referencia);
            if (Storage::disk($this->disk())->delete($ruta)) {
                $eliminados++;
            }
        }

        return ['eliminados' => $eliminados];
    }

    private function cuentoEditable(Usuario $usuario, string $cuentoId): array
    {
        $cuento = $this->cuentoPropio($usuario, $cuentoId);
        if (($cuento['fields']['estado'] ?? null) !== 'borrador') {
            throw new CuentoV2Exception('El cuento ya no admite cambios de archivos.', 409, 'CUENTO_NO_EDITABLE');
        }

        return $cuento;
    }

    private function cuentoLegible(Usuario $usuario, string $cuentoId): array
    {
        $cuento = $this->documentos->obtener('cuentos/'.$this->idSeguro($cuentoId));
        if ($cuento === null) {
            throw new CuentoV2Exception('El cuento no existe.', 404, 'CUENTO_NO_ENCONTRADO');
        }
        $esPropio = ($cuento['fields']['autor_uid'] ?? null) === $this->uid($usuario);
        $esPublicado = ($cuento['fields']['estado'] ?? null) === 'publicado'
            && ($cuento['fields']['moderacion_estado'] ?? null) === 'aprobado';
        if (! $esPropio && ! $esPublicado) {
            throw new CuentoV2Exception('No puedes leer estos archivos.', 403, 'ACTIVO_AJENO');
        }

        return $cuento;
    }

    private function cuentoPropio(Usuario $usuario, string $cuentoId): array
    {
        $cuento = $this->documentos->obtener('cuentos/'.$this->idSeguro($cuentoId));
        if ($cuento === null || ($cuento['fields']['autor_uid'] ?? null) !== $this->uid($usuario)) {
            throw new CuentoV2Exception('No puedes operar estos archivos.', 403, 'ACTIVO_AJENO');
        }

        return $cuento;
    }

    private function rutaPropia(Usuario $usuario, string $cuentoId, string $referencia): string
    {
        $prefijo = 'cuentos/borradores/'.substr(hash('sha256', $this->uid($usuario)), 0, 32).'/'.$this->idSeguro($cuentoId).'/';
        $ruta = $this->decodificarReferencia($referencia);
        if (! str_starts_with($ruta, $prefijo) || str_contains($ruta, '..')) {
            throw new CuentoV2Exception('La referencia del activo no es vÃ¡lida.', 422, 'REFERENCIA_INVALIDA');
        }

        return $ruta;
    }

    private function rutaDelCuento(string $cuentoId, string $referencia): string
    {
        $ruta = $this->decodificarReferencia($referencia);
        $id = $this->idSeguro($cuentoId);
        if (! preg_match('#^cuentos/borradores/[a-f0-9]{32}/'.preg_quote($id, '#').'/#', $ruta)
            || str_contains($ruta, '..')) {
            throw new CuentoV2Exception('La referencia del activo no es vÃ¡lida.', 422, 'REFERENCIA_INVALIDA');
        }

        return $ruta;
    }

    private function referencia(string $ruta): string
    {
        return 'storage://'.$this->disk().'/'.$ruta;
    }

    private function decodificarReferencia(string $referencia): string
    {
        $prefijo = 'storage://'.$this->disk().'/';
        if (! str_starts_with($referencia, $prefijo)) {
            throw new CuentoV2Exception('La referencia del activo no es vÃ¡lida.', 422, 'REFERENCIA_INVALIDA');
        }

        return substr($referencia, strlen($prefijo));
    }

    private function urlTemporal(string $ruta): string
    {
        return Storage::disk($this->disk())->temporaryUrl(
            $ruta,
            now()->addMinutes((int) config('cuentos.activos_url_ttl_minutos', 5)),
        );
    }

    private function disk(): string
    {
        return (string) config('cuentos.activos_disk', 'supabase_private');
    }

    private function uid(Usuario $usuario): string
    {
        $uid = trim((string) $usuario->firebase_uid);
        if ($uid === '') {
            throw new CuentoV2Exception('La cuenta no estÃ¡ enlazada con Firebase.', 409, 'FIREBASE_UID_AUSENTE');
        }

        return $uid;
    }

    private function idSeguro(string $id): string
    {
        if (! preg_match('/^[A-Za-z0-9_-]{1,128}$/', $id)) {
            throw new CuentoV2Exception('El identificador no es vÃ¡lido.', 422, 'ID_INVALIDO');
        }

        return $id;
    }
}
