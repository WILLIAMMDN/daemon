<?php

namespace App\Services\Tienda;

use App\Models\Canje;
use App\Models\CosmeticoMascota;
use App\Models\InventarioMascota;
use App\Models\Premio;
use App\Models\Usuario;
use App\Services\Economia\EconomiaService;
use Illuminate\Support\Facades\DB;

class CanjeService
{
    public function __construct(private readonly EconomiaService $economia) {}

    public function canjear(Usuario $solicitante, Premio $premio): array
    {
        return DB::transaction(function () use ($solicitante, $premio) {
            $usuario = Usuario::lockForUpdate()->findOrFail($solicitante->id);
            $premio = Premio::lockForUpdate()->findOrFail($premio->id);
            $cosmetico = null;
            if ($premio->tipo_entrega === 'cosmetico') {
                $cosmetico = CosmeticoMascota::where('id_premio', $premio->id)->lockForUpdate()->first();
                abort_unless($cosmetico?->activo, 422, 'Este cosmetico no esta disponible.');
                abort_if(
                    InventarioMascota::where('id_alumno', $usuario->id)->where('id_cosmetico', $cosmetico->id)->exists(),
                    422,
                    'Este accesorio ya pertenece a tu inventario.',
                );
            }
            abort_if($premio->stock < 1, 422, 'Premio agotado.');
            abort_if($usuario->tokens < $premio->precio, 422, 'Tokens insuficientes.');

            $premio->decrement('stock');
            $canje = Canje::create([
                'id_alumno' => $usuario->id,
                'id_premio' => $premio->id,
                'estado' => in_array($premio->tipo_entrega, ['digital', 'cosmetico'], true) ? 'entregado' : 'pendiente',
            ]);
            $usuario = $this->economia->ajustarDaemons(
                $usuario,
                -$premio->precio,
                'tienda_canje',
                $canje->id,
                $usuario,
                "tienda:canje:{$canje->id}",
                "Canje: {$premio->nombre}",
                ['id_premio' => $premio->id],
            );

            if ($cosmetico) {
                InventarioMascota::create([
                    'id_alumno' => $usuario->id,
                    'id_cosmetico' => $cosmetico->id,
                    'id_canje' => $canje->id,
                    'fuente' => 'tienda',
                ]);
            }

            $digital = null;
            if ($premio->tipo_entrega === 'digital') {
                $digital = DB::table('premios_stock_digital')->where('id_premio', $premio->id)->where('estado', 'disponible')->lockForUpdate()->first();
                if ($digital) {
                    DB::table('premios_stock_digital')->where('id', $digital->id)->update(['estado' => 'entregado', 'id_canje' => $canje->id]);
                }
            }

            return [
                'canje' => $canje,
                'saldo' => $usuario->tokens,
                'codigo' => $digital?->dato_privado,
                'cosmetico' => $cosmetico ? [
                    'id' => $cosmetico->id,
                    'nombre' => $cosmetico->nombre,
                    'slot' => $cosmetico->slot,
                    'ruta_vestidor' => '/alumno/mascota',
                ] : null,
            ];
        }, 3);
    }
}
