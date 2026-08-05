<?php

namespace Tests\Unit;

use App\Contracts\Cuento\CuentoDocumentoGateway;
use App\Exceptions\CuentoV2Exception;
use App\Models\Usuario;
use App\Services\Cuento\CuentoV2Service;
use Tests\TestCase;

class CuentoV2ServiceTest extends TestCase
{
    public function test_publicacion_y_eliminacion_son_idempotentes_y_verifican_owner(): void
    {
        $gateway = new CuentoDocumentoGatewayMemoria;
        $gateway->sembrar('cuentos/cuento-1', [
            'schema_version' => 2,
            'autor_uid' => 'uid-owner',
            'estado' => 'borrador',
            'version_borrador_id' => 'version-1',
        ]);
        $gateway->sembrar('cuentos/cuento-1/versiones/version-1', [
            'titulo' => 'Historia segura',
            'paginas' => 1,
            'palabras' => 20,
        ]);
        $servicio = new CuentoV2Service($gateway);
        $owner = $this->usuario('uid-owner');

        $primero = $servicio->solicitarPublicacion($owner, 'cuento-1');
        $repetido = $servicio->solicitarPublicacion($owner, 'cuento-1');

        $this->assertSame(['estado' => 'en_revision', 'repetido' => false], $primero);
        $this->assertSame(['estado' => 'en_revision', 'repetido' => true], $repetido);
        $this->assertSame('pendiente', $gateway->campos('cuentos/cuento-1')['moderacion_estado']);

        $eliminado = $servicio->eliminar($owner, 'cuento-1');
        $eliminadoRepetido = $servicio->eliminar($owner, 'cuento-1');
        $this->assertFalse($eliminado['repetido']);
        $this->assertTrue($eliminadoRepetido['repetido']);

        $this->expectException(CuentoV2Exception::class);
        $servicio->eliminar($this->usuario('uid-ajeno'), 'cuento-1');
    }

    public function test_comentario_usa_id_determinista_sanitiza_y_no_duplica(): void
    {
        $gateway = new CuentoDocumentoGatewayMemoria;
        $gateway->sembrar('cuentos/publicado-1', [
            'schema_version' => 2,
            'autor_uid' => 'uid-autor',
            'estado' => 'publicado',
            'moderacion_estado' => 'aprobado',
            'comentarios_bloqueados' => false,
        ]);
        $servicio = new CuentoV2Service($gateway);
        $usuario = $this->usuario('uid-lector');

        $primero = $servicio->comentar($usuario, 'publicado-1', ' Hola <b>mundo</b> ', 'clave-idempotente-123');
        $repetido = $servicio->comentar($usuario, 'publicado-1', 'otro texto', 'clave-idempotente-123');

        $this->assertSame($primero['id'], $repetido['id']);
        $this->assertSame('Hola mundo', $primero['cuerpo']);
        $this->assertSame('Hola mundo', $repetido['cuerpo']);
        $this->assertCount(2, $gateway->documentos());
    }

    public function test_rechaza_comentarios_en_cuento_no_publicado(): void
    {
        $gateway = new CuentoDocumentoGatewayMemoria;
        $gateway->sembrar('cuentos/borrador-1', [
            'schema_version' => 2,
            'autor_uid' => 'uid-owner',
            'estado' => 'borrador',
            'moderacion_estado' => 'no_solicitada',
            'comentarios_bloqueados' => true,
        ]);

        $this->expectException(CuentoV2Exception::class);
        (new CuentoV2Service($gateway))->comentar(
            $this->usuario('uid-owner'),
            'borrador-1',
            'No debería entrar',
            'clave-idempotente-456',
        );
    }

    public function test_reaccion_determinista_y_agregados_no_se_desincronizan(): void
    {
        $gateway = new CuentoDocumentoGatewayMemoria;
        $gateway->sembrar('cuentos/publicado-2', [
            'schema_version' => 2,
            'autor_uid' => 'uid-autor',
            'estado' => 'publicado',
            'moderacion_estado' => 'aprobado',
            'comentarios_bloqueados' => false,
        ]);
        $servicio = new CuentoV2Service($gateway);
        $lector = $this->usuario('uid-lector');

        $primera = $servicio->reaccionar($lector, 'publicado-2', 'encanto');
        $repetida = $servicio->reaccionar($lector, 'publicado-2', 'encanto');
        $cambiada = $servicio->reaccionar($lector, 'publicado-2', 'gusto');
        $estadisticas = $servicio->estadisticas($lector, 'publicado-2');

        $this->assertFalse($primera['repetido']);
        $this->assertTrue($repetida['repetido']);
        $this->assertFalse($cambiada['repetido']);
        $this->assertSame(1, $estadisticas['reacciones']['total']);
        $this->assertSame(1, $estadisticas['reacciones']['por_tipo']['gusto']);
        $this->assertSame(0, $estadisticas['reacciones']['por_tipo']['encanto']);
        $this->assertSame('gusto', $estadisticas['reacciones']['propia']);

        $servicio->reaccionar($lector, 'publicado-2', null);
        $eliminadaRepetida = $servicio->reaccionar($lector, 'publicado-2', null);
        $this->assertTrue($eliminadaRepetida['repetido']);
        $this->assertSame(0, $servicio->estadisticas($lector, 'publicado-2')['reacciones']['total']);
    }

    public function test_eliminar_cuento_legacy_por_id_alumno_y_rechaza_ajeno(): void
    {
        // Regresión: borrar un cuento del esquema legado (schema 1, id_alumno)
        // devolvía 404 porque el v2 exigía schema_version 2. El dueño debe
        // poder borrar sus cuentos antiguos; un ajeno debe recibir 403.
        $gateway = new CuentoDocumentoGatewayMemoria;
        $gateway->sembrar('cuentos/legacy-1', [
            'autor_uid' => 'legacy-42',
            'id_alumno' => 42,
            'estado' => 'publicado',
            'visibilidad' => 'publico',
        ]);
        $servicio = new CuentoV2Service($gateway);
        $dueno = new Usuario;
        $dueno->forceFill(['id' => 42, 'firebase_uid' => 'uid-42', 'rol' => 'alumno']);
        $ajeno = new Usuario;
        $ajeno->forceFill(['id' => 99, 'firebase_uid' => 'uid-99', 'rol' => 'alumno']);

        $resultado = $servicio->eliminar($dueno, 'legacy-1');

        $this->assertSame(['estado' => 'eliminado', 'repetido' => false], $resultado);
        $this->assertSame('eliminado', $gateway->campos('cuentos/legacy-1')['estado']);

        $this->expectException(CuentoV2Exception::class);
        $servicio->eliminar($ajeno, 'legacy-1');
    }

    public function test_guardar_borrador_vacio_aplica_defaults_y_no_usa_variables_cerradas_por_la_clausura(): void
    {
        // Regresión: la clausura de Cache::lock no capturaba $usuario y
        // detalle() (línea final) lanzaba "Undefined variable $usuario"
        // -> 500. Además valida que un borrador vacío se guarda con defaults.
        $gateway = new CuentoDocumentoGatewayMemoria;
        $gateway->sembrar('cuentos/cuento-vacio', [
            'schema_version' => 2,
            'autor_uid' => 'uid-owner',
            'estado' => 'borrador',
            'visibilidad' => 'privado',
            'version_borrador_id' => 'version-1',
        ]);
        $servicio = new CuentoV2Service($gateway);

        $detalle = $servicio->guardarBorrador($this->usuario('uid-owner'), [
            'cuento_id' => 'cuento-vacio',
            'version_id' => 'version-1',
            'titulo' => '',
            'sinopsis' => '',
            'categoria' => '',
            'rango_edad' => '',
            'portada_ref' => null,
            'revision_esperada' => 0,
            'paginas' => [[
                'id' => 'p1',
                'orden' => 1,
                'contenido' => '',
                'ilustracion_ref' => null,
                'texto_alternativo' => '',
                'fondo_token' => 'var(--daemon-surface)',
            ]],
        ]);

        $this->assertSame('Historia sin título', $detalle['version']['titulo']);
        $this->assertSame('Sin clasificar', $detalle['version']['categoria']);
        $this->assertSame('version-1', $detalle['cuento']['version_borrador_id']);
    }

    private function usuario(string $uid): Usuario
    {
        $usuario = new Usuario;
        $usuario->forceFill(['firebase_uid' => $uid, 'rol' => 'alumno']);

        return $usuario;
    }
}

class CuentoDocumentoGatewayMemoria implements CuentoDocumentoGateway
{
    /** @var array<string, array{name: string, fields: array<string, mixed>, updateTime: string}> */
    private array $datos = [];

    /** @param array<string, mixed> $campos */
    public function sembrar(string $ruta, array $campos): void
    {
        $this->datos[$ruta] = [
            'name' => $ruta,
            'fields' => $campos,
            'updateTime' => '2026-08-02T10:00:00.000000Z',
        ];
    }

    public function obtener(string $ruta): ?array
    {
        return $this->datos[$ruta] ?? null;
    }

    public function actualizar(string $ruta, array $campos, array $timestampsServidor, string $updateTime): array
    {
        $actual = $this->datos[$ruta] ?? throw new CuentoV2Exception('No existe.', 404);
        if ($actual['updateTime'] !== $updateTime) {
            throw new CuentoV2Exception('Conflicto.', 409);
        }
        foreach ($timestampsServidor as $campo) {
            $campos[$campo] = '2026-08-02T10:01:00.000000Z';
        }
        $this->datos[$ruta] = [
            'name' => $ruta,
            'fields' => [...$actual['fields'], ...$campos],
            'updateTime' => '2026-08-02T10:01:00.000000Z',
        ];

        return $this->datos[$ruta];
    }

    public function crear(string $ruta, array $campos, array $timestampsServidor): array
    {
        if (isset($this->datos[$ruta])) {
            throw new CuentoV2Exception('Ya existe.', 409);
        }
        foreach ($timestampsServidor as $campo) {
            $campos[$campo] = '2026-08-02T10:01:00.000000Z';
        }
        $this->sembrar($ruta, $campos);

        return $this->datos[$ruta];
    }

    public function eliminar(string $ruta, string $updateTime): void
    {
        $actual = $this->datos[$ruta] ?? throw new CuentoV2Exception('No existe.', 404);
        if ($actual['updateTime'] !== $updateTime) {
            throw new CuentoV2Exception('Conflicto.', 409);
        }
        unset($this->datos[$ruta]);
    }

    public function contar(string $rutaColeccion, array $filtrosIgualdad = []): int
    {
        return count($this->listar($rutaColeccion, $filtrosIgualdad));
    }

    public function listar(
        string $rutaColeccion,
        array $filtrosIgualdad = [],
        ?array $orden = null,
        int $limite = 30,
    ): array {
        $prefijo = rtrim($rutaColeccion, '/').'/';
        $resultados = [];
        foreach ($this->datos as $ruta => $documento) {
            if (! str_starts_with($ruta, $prefijo)
                || str_contains(substr($ruta, strlen($prefijo)), '/')) {
                continue;
            }
            foreach ($filtrosIgualdad as $campo => $valor) {
                if (($documento['fields'][$campo] ?? null) !== $valor) {
                    continue 2;
                }
            }
            $resultados[] = $documento;
        }

        return array_slice($resultados, 0, max(1, min($limite, 50)));
    }

    /** @return array<string, mixed> */
    public function campos(string $ruta): array
    {
        return $this->datos[$ruta]['fields'];
    }

    /** @return array<string, array{name: string, fields: array<string, mixed>, updateTime: string}> */
    public function documentos(): array
    {
        return $this->datos;
    }
}
