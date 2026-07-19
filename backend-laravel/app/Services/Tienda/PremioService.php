<?php

namespace App\Services\Tienda;

use App\Models\Canje;
use App\Models\CosmeticoMascota;
use App\Models\EquipamientoMascota;
use App\Models\InventarioMascota;
use App\Models\MascotaAlumno;
use App\Models\Premio;
use Illuminate\Support\Facades\DB;

class PremioService
{
    public function crear(array $datos): Premio
    {
        return DB::transaction(function () use ($datos) {
            $codigos = $datos['codigos'] ?? [];
            $cosmetico = $datos['cosmetico'] ?? null;
            unset($datos['codigos'], $datos['cosmetico']);

            abort_if($datos['tipo_entrega'] === 'cosmetico' && ! $cosmetico, 422, 'Debes configurar el cosmetico.');
            if ($datos['tipo_entrega'] === 'cosmetico' && empty($datos['imagen'])) {
                $datos['imagen'] = ($cosmetico['asset_miniatura'] ?? null) ?: $cosmetico['asset_capa'];
            } elseif (empty($datos['imagen'])) {
                unset($datos['imagen']);
            }

            $premio = Premio::create($datos);

            if ($cosmetico) {
                $this->guardarCosmetico($premio, $cosmetico);
            }

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
        return DB::transaction(function () use ($premio, $datos) {
            $cosmeticoDatos = $datos['cosmetico'] ?? null;
            unset($datos['cosmetico']);
            $tipo = $datos['tipo_entrega'] ?? $premio->tipo_entrega;
            $cosmeticoActual = $premio->cosmetico()->first();

            abort_if($tipo === 'cosmetico' && ! $cosmeticoActual && ! $cosmeticoDatos, 422, 'Debes configurar el cosmetico.');

            if (array_key_exists('imagen', $datos) && empty($datos['imagen'])) {
                if ($tipo === 'cosmetico' && $cosmeticoDatos) {
                    $datos['imagen'] = ($cosmeticoDatos['asset_miniatura'] ?? null) ?: $cosmeticoDatos['asset_capa'];
                } else {
                    unset($datos['imagen']);
                }
            }

            $premio->update($datos);

            if ($tipo === 'cosmetico') {
                if ($cosmeticoDatos) {
                    $this->guardarCosmetico($premio, $cosmeticoDatos);
                } elseif ($cosmeticoActual && $cosmeticoActual->nombre !== $premio->nombre) {
                    $cosmeticoActual->update(['nombre' => $premio->nombre]);
                }
            } elseif ($cosmeticoActual) {
                abort_if(
                    InventarioMascota::where('id_cosmetico', $cosmeticoActual->id)->exists(),
                    422,
                    'No puedes convertir un cosmetico que ya pertenece a estudiantes.',
                );
                $cosmeticoActual->delete();
            }

            return $premio->fresh('cosmetico.especies');
        });
    }

    public function eliminar(Premio $premio): void
    {
        abort_if(Canje::where('id_premio', $premio->id)->exists(), 422, 'El premio ya tiene canjes.');

        DB::transaction(function () use ($premio) {
            $cosmetico = $premio->cosmetico()->first();
            abort_if(
                $cosmetico && InventarioMascota::where('id_cosmetico', $cosmetico->id)->exists(),
                422,
                'El cosmetico pertenece al inventario de estudiantes.',
            );
            DB::table('premios_stock_digital')->where('id_premio', $premio->id)->delete();
            $cosmetico?->delete();
            $premio->delete();
        });
    }

    private function guardarCosmetico(Premio $premio, array $datos): CosmeticoMascota
    {
        $actualizaEspecies = array_key_exists('especies', $datos);
        $especies = $datos['especies'] ?? [];
        unset($datos['especies']);
        $existente = CosmeticoMascota::where('id_premio', $premio->id)->first();
        $slotAnterior = $existente?->slot;

        $cosmetico = CosmeticoMascota::updateOrCreate(
            ['id_premio' => $premio->id],
            [...$datos, 'nombre' => $premio->nombre],
        );
        if ($actualizaEspecies) {
            $cosmetico->especies()->sync($especies);
        }

        if ($slotAnterior !== null && $slotAnterior !== $cosmetico->slot) {
            EquipamientoMascota::where('id_cosmetico', $cosmetico->id)->delete();
        }

        if ($actualizaEspecies) {
            $mascotasIncompatibles = MascotaAlumno::whereNotIn('id_especie', $especies)->pluck('id');
            EquipamientoMascota::where('id_cosmetico', $cosmetico->id)
                ->whereIn('id_mascota', $mascotasIncompatibles)
                ->delete();
        }

        return $cosmetico;
    }
}
