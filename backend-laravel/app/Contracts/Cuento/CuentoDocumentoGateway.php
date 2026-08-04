<?php

namespace App\Contracts\Cuento;

interface CuentoDocumentoGateway
{
    /**
     * @return array{name: string, fields: array<string, mixed>, updateTime: string}|null
     */
    public function obtener(string $ruta): ?array;

    /**
     * @param  array<string, mixed>  $campos
     * @param  list<string>  $timestampsServidor
     * @return array{name: string, fields: array<string, mixed>, updateTime: string}
     */
    public function actualizar(
        string $ruta,
        array $campos,
        array $timestampsServidor,
        string $updateTime,
    ): array;

    /**
     * @param  array<string, mixed>  $campos
     * @param  list<string>  $timestampsServidor
     * @return array{name: string, fields: array<string, mixed>, updateTime: string}
     */
    public function crear(string $ruta, array $campos, array $timestampsServidor): array;

    public function eliminar(string $ruta, string $updateTime): void;

    /** @param array<string, scalar|null> $filtrosIgualdad */
    public function contar(string $rutaColeccion, array $filtrosIgualdad = []): int;

    /**
     * @param  array<string, scalar|null>  $filtrosIgualdad
     * @param  array{0: string, 1: string}|null  $orden  [campo, ASC|DESC]
     * @return list<array{name: string, fields: array<string, mixed>, updateTime: string}>
     */
    public function listar(
        string $rutaColeccion,
        array $filtrosIgualdad = [],
        ?array $orden = null,
        int $limite = 30,
    ): array;
}
