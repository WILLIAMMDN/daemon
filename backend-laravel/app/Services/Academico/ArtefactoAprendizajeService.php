<?php

namespace App\Services\Academico;

use App\Models\ArtefactoAprendizaje;
use App\Models\EvidenciaAprendizaje;
use App\Models\IntentoAprendizaje;
use App\Models\Usuario;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ArtefactoAprendizajeService
{
    /** @var array<string, array<int, string>> */
    private const ALLOWED_MIME_EXTENSIONS = [
        'image/jpeg' => ['jpg', 'jpeg'],
        'image/png' => ['png'],
        'image/webp' => ['webp'],
        'application/pdf' => ['pdf'],
    ];

    /** @var array<int, string> */
    private const DANGEROUS_EXTENSIONS = [
        'php', 'php3', 'php4', 'php5', 'phtml', 'phar',
        'exe', 'bat', 'cmd', 'sh', 'bash', 'ps1',
        'js', 'mjs', 'ts', 'html', 'htm', 'xhtml',
        'svg', 'xml', 'jar', 'vbs', 'scr', 'msi',
        'zip', 'tar', 'gz', '7z', 'rar',
    ];

    private const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

    public function subirArchivo(Usuario $alumno, IntentoAprendizaje $intento, UploadedFile $archivo): ArtefactoAprendizaje
    {
        $this->autorizarEscrituraIntento($alumno, $intento);

        // 1. Validar tamaño
        if ($archivo->getSize() > self::MAX_SIZE_BYTES) {
            abort(422, 'El archivo supera el tamaño máximo permitido de 10 MB.');
        }

        $nombreOriginal = $archivo->getClientOriginalName();
        $this->validarNombreOriginal($nombreOriginal);

        // 2. Validar extensión y contenido real del archivo
        $ext = strtolower($archivo->getClientOriginalExtension());
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $realMime = $finfo ? finfo_file($finfo, $archivo->getRealPath()) : $archivo->getMimeType();
        if ($finfo) {
            finfo_close($finfo);
        }

        $realMime = is_string($realMime) ? strtolower($realMime) : '';

        // Bloqueo explícito de SVG y tipos peligrosos
        if ($realMime === 'image/svg+xml' || $ext === 'svg') {
            abort(422, 'Los archivos SVG no están permitidos por motivos de seguridad.');
        }

        if (! array_key_exists($realMime, self::ALLOWED_MIME_EXTENSIONS) || ! in_array($ext, self::ALLOWED_MIME_EXTENSIONS[$realMime], true)) {
            abort(422, "El formato de archivo ({$realMime} / .{$ext}) no está permitido. Formatos soportados: JPEG, PNG, WEBP y PDF.");
        }

        // 3. Almacenamiento seguro
        $disk = $this->diskParaArtefactos();
        $uuid = (string) Str::uuid();
        $storageFilename = "{$uuid}.{$ext}";
        $storagePath = "uploads/artefactos/{$intento->uuid}/{$storageFilename}";

        $checksum = hash_file('sha256', $archivo->getRealPath());

        // Metadatos de imagen si aplica
        $metadatos = [];
        if (str_starts_with($realMime, 'image/')) {
            $imageSize = @getimagesize($archivo->getRealPath());
            if ($imageSize !== false) {
                $metadatos['dimensiones'] = [
                    'ancho' => $imageSize[0],
                    'alto' => $imageSize[1],
                ];
            }
            $categoria = 'image';
        } elseif ($realMime === 'application/pdf') {
            $categoria = 'document';
        } else {
            $categoria = 'file';
        }

        // Guardar archivo en disco privado
        $stream = fopen($archivo->getRealPath(), 'r');
        Storage::disk($disk)->put($storagePath, $stream);
        if (is_resource($stream)) {
            fclose($stream);
        }

        return ArtefactoAprendizaje::create([
            'uuid' => $uuid,
            'id_intento' => $intento->id,
            'id_evidencia' => null,
            'id_usuario' => $alumno->id,
            'categoria' => $categoria,
            'nombre_original' => $this->sanitizarNombreDisplay($nombreOriginal),
            'storage_path' => $storagePath,
            'disk' => $disk,
            'mime_type' => $realMime,
            'tamanio_bytes' => $archivo->getSize(),
            'checksum_sha256' => $checksum,
            'url_externa' => null,
            'metadatos' => $metadatos ?: null,
        ]);
    }

    public function adjuntarEnlaceExterno(Usuario $alumno, IntentoAprendizaje $intento, string $url, ?string $titulo = null): ArtefactoAprendizaje
    {
        $this->autorizarEscrituraIntento($alumno, $intento);

        $urlLimpia = trim($url);
        $this->validarUrlExterna($urlLimpia);

        $uuid = (string) Str::uuid();
        $host = parse_url($urlLimpia, PHP_URL_HOST);
        $display = ! empty($titulo) ? trim($titulo) : ($host ?: 'Enlace externo');

        return ArtefactoAprendizaje::create([
            'uuid' => $uuid,
            'id_intento' => $intento->id,
            'id_evidencia' => null,
            'id_usuario' => $alumno->id,
            'categoria' => 'external_link',
            'nombre_original' => $display,
            'storage_path' => null,
            'disk' => null,
            'mime_type' => null,
            'tamanio_bytes' => null,
            'checksum_sha256' => null,
            'url_externa' => $urlLimpia,
            'metadatos' => ['host' => $host],
        ]);
    }

    public function eliminarBorrador(Usuario $alumno, IntentoAprendizaje $intento, ArtefactoAprendizaje $artefacto): void
    {
        $this->autorizarEscrituraIntento($alumno, $intento);
        abort_unless((int) $artefacto->id_intento === (int) $intento->id, 404, 'El artefacto no pertenece a este intento.');

        if ($artefacto->storage_path && $artefacto->disk) {
            Storage::disk($artefacto->disk)->delete($artefacto->storage_path);
        }

        $artefacto->delete();
    }

    public function autorizarAcceso(Usuario $actor, ArtefactoAprendizaje $artefacto): void
    {
        // 1. Dueño del artefacto (estudiante)
        if ((int) $actor->id === (int) $artefacto->id_usuario) {
            return;
        }

        // 2. Administrador
        if ($actor->rol === 'admin') {
            return;
        }

        // 3. Docente con alcance al aula/institución del intento
        if ($actor->rol === 'docente') {
            $intento = $artefacto->intento()->with('matricula.aula')->first();
            abort_unless($intento && $intento->matricula && $intento->matricula->aula, 403, 'No tienes acceso a este artefacto.');

            $aula = $intento->matricula->aula;
            if (filled($actor->id_institucion) && filled($aula->id_institucion)) {
                abort_unless((int) $actor->id_institucion === (int) $aula->id_institucion, 403, 'No tienes acceso a artefactos de otra institución.');
            }
            if (filled($actor->id_aula)) {
                abort_unless((int) $actor->id_aula === (int) $aula->id, 403, 'No tienes acceso a artefactos de otra aula.');
            }

            return;
        }

        abort(403, 'Acceso no autorizado al artefacto académico.');
    }

    public function descargarContenido(Usuario $actor, ArtefactoAprendizaje $artefacto)
    {
        $this->autorizarAcceso($actor, $artefacto);

        if ($artefacto->categoria === 'external_link') {
            abort_unless(filled($artefacto->url_externa), 404, 'Enlace no configurado.');

            return response()->json(['url' => $artefacto->url_externa]);
        }

        abort_unless(filled($artefacto->storage_path) && filled($artefacto->disk), 404, 'Ruta de archivo no disponible.');
        abort_unless(Storage::disk($artefacto->disk)->exists($artefacto->storage_path), 404, 'El archivo físico no se encuentra en el almacenamiento.');

        $mime = $artefacto->mime_type ?: 'application/octet-stream';
        $filename = $artefacto->nombre_original;

        return Storage::disk($artefacto->disk)->response($artefacto->storage_path, $filename, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="'.addslashes($filename).'"',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-transform, max-age=3600',
        ]);
    }

    public function asociarEvidencia(EvidenciaAprendizaje $evidencia, array $artefactoIds): void
    {
        if (empty($artefactoIds)) {
            return;
        }

        ArtefactoAprendizaje::query()
            ->where('id_intento', $evidencia->id_intento)
            ->whereIn('id', $artefactoIds)
            ->update(['id_evidencia' => $evidencia->id]);
    }

    public function serializarArtefacto(ArtefactoAprendizaje $artefacto): array
    {
        return [
            'id' => $artefacto->id,
            'uuid' => $artefacto->uuid,
            'category' => $artefacto->categoria,
            'originalName' => $artefacto->nombre_original,
            'mimeType' => $artefacto->mime_type,
            'sizeBytes' => $artefacto->tamanio_bytes,
            'downloadUrl' => $artefacto->categoria !== 'external_link' ? "/api/v1/academico/artefactos/{$artefacto->id}/contenido" : null,
            'externalUrl' => $artefacto->url_externa,
            'checksumSha256' => $artefacto->checksum_sha256,
            'registeredAt' => $artefacto->created_at?->toIso8601String(),
            'metadata' => $artefacto->metadatos,
        ];
    }

    private function autorizarEscrituraIntento(Usuario $alumno, IntentoAprendizaje $intento): void
    {
        abort_unless((int) $intento->id_alumno === (int) $alumno->id, 403, 'No puedes adjuntar artefactos a un intento ajeno.');
        abort_unless($intento->estado === 'started', 422, 'Solo se pueden adjuntar o modificar artefactos en un intento en progreso (borrador).');
    }

    private function validarNombreOriginal(string $nombre): void
    {
        abort_if(strlen($nombre) > 255, 422, 'El nombre del archivo es demasiado largo.');

        // Verificar doble extensión peligrosa (ej. script.php.png o malware.exe.pdf)
        $partes = explode('.', $nombre);
        if (count($partes) > 2) {
            array_pop($partes); // Quita la extensión final
            foreach ($partes as $parte) {
                if (in_array(strtolower($parte), self::DANGEROUS_EXTENSIONS, true)) {
                    abort(422, 'El archivo contiene extensiones secundarias no permitidas.');
                }
            }
        }
    }

    private function sanitizarNombreDisplay(string $nombre): string
    {
        $limpio = basename($nombre);
        $limpio = str_replace(["\0", "\r", "\n", '/', '\\'], '', $limpio);

        return mb_substr($limpio, 0, 200);
    }

    private function validarUrlExterna(string $url): void
    {
        if (! str_starts_with($url, 'https://')) {
            abort(422, 'El enlace externo debe comenzar con https://.');
        }

        if (filter_var($url, FILTER_VALIDATE_URL) === false) {
            abort(422, 'El enlace proporcionado no es una URL válida.');
        }

        $host = strtolower((string) parse_url($url, PHP_URL_HOST));
        if ($host === 'localhost' || $host === '127.0.0.1' || $host === '0.0.0.0' || str_ends_with($host, '.local') || $host === '169.254.169.254') {
            abort(422, 'No se permiten enlaces a direcciones locales o privadas.');
        }
    }

    private function diskParaArtefactos(): string
    {
        $diskConfig = (string) config('daemon.private_uploads_disk', 'supabase_private');
        if (config()->has("filesystems.disks.{$diskConfig}")) {
            if ($diskConfig === 'supabase_private' && blank(config('filesystems.disks.supabase_private.key'))) {
                return 'local';
            }

            return $diskConfig;
        }

        return 'local';
    }
}
