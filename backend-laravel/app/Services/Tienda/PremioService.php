<?php

namespace App\Services\Tienda;

use App\Models\Canje;
use App\Models\Premio;
use Illuminate\Support\Facades\DB;

class PremioService
{
    public function crear(array $datos): Premio
    {
        return DB::transaction(function () use ($datos) {
            $codigos = $datos['codigos'] ?? [];
            unset($datos['codigos']);

            $premio = Premio::create($datos);

            foreach ($codigos as $codigo) {
                DB::table('premios_stock_digital')->insert([
                    'id_premio' => $premio->id,
                    'dato_publico' => $codigo['publico'] ?? null,
                    'dato_privado' => $codigo['privado'] ?? null,
                ]);
            }

            return $premio;
        });
    }

    public function actualizar(Premio $premio, array $datos): Premio
    {
        $premio->update($datos);

        return $premio->fresh();
    }

    public function eliminar(Premio $premio): void
    {
        abort_if(Canje::where('id_premio', $premio->id)->exists(), 422, 'El premio ya tiene canjes.');

        DB::transaction(function () use ($premio) {
            DB::table('premios_stock_digital')->where('id_premio', $premio->id)->delete();
            $premio->delete();
        });
    }
}
