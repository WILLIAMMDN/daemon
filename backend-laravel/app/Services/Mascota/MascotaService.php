<?php

namespace App\Services\Mascota;

use App\Enums\MascotaSlot;
use App\Models\CosmeticoMascota;
use App\Models\EquipamientoMascota;
use App\Models\EspecieMascota;
use App\Models\InventarioMascota;
use App\Models\MascotaAlumno;
use App\Models\Usuario;
use App\Services\Archivo\ArchivoUrlService;
use Illuminate\Support\Facades\DB;

class MascotaService
{
    public function __construct(private readonly ArchivoUrlService $archivos) {}

    public function estado(Usuario $alumno): array
    {
        $mascota = $this->obtenerOCrear($alumno);
        $mascota->load(['especie', 'equipamientos.cosmetico']);

        $compatibles = DB::table('mascota_compatibilidades')
            ->where('id_especie', $mascota->id_especie)
            ->pluck('id_cosmetico');
        $poseidos = InventarioMascota::where('id_alumno', $alumno->id)
            ->pluck('id_cosmetico');
        $equipados = $mascota->equipamientos->keyBy('id_cosmetico');

        $cosmeticos = CosmeticoMascota::query()
            ->with(['premio', 'especies:id,nombre'])
            ->where(function ($query) use ($compatibles, $poseidos) {
                $query->whereIn('id', $compatibles)->orWhereIn('id', $poseidos);
            })
            ->where(function ($query) use ($poseidos) {
                $query->where('activo', true)->orWhereIn('id', $poseidos);
            })
            ->orderBy('slot')
            ->orderBy('orden_capa')
            ->orderBy('nombre')
            ->get()
            ->map(fn (CosmeticoMascota $cosmetico) => $this->presentarCosmetico(
                $cosmetico,
                $poseidos->contains($cosmetico->id),
                $equipados->has($cosmetico->id),
                $compatibles->contains($cosmetico->id),
            ))
            ->values();

        $capas = collect([[
            'id' => 'base-'.$mascota->especie->codigo,
            'tipo' => 'base',
            'slot' => 'base',
            'orden' => 0,
            'asset' => $this->archivos->url($mascota->especie->asset_base),
            'alt' => $mascota->especie->nombre,
        ]])->merge($mascota->equipamientos->map(function (EquipamientoMascota $equipo) {
            return [
                'id' => $equipo->cosmetico->id,
                'tipo' => 'cosmetico',
                'slot' => $equipo->slot,
                'orden' => $equipo->cosmetico->orden_capa,
                'asset' => $this->archivos->url($equipo->cosmetico->asset_capa),
                'alt' => $equipo->cosmetico->nombre,
            ];
        }))->sortBy('orden')->values();

        return [
            'saldo' => (int) $alumno->fresh()->tokens,
            'mascota' => [
                'id' => $mascota->id,
                'nombre' => $mascota->nombre,
                'especie' => $this->presentarEspecie($mascota->especie),
                'capas' => $capas,
            ],
            'especies' => EspecieMascota::where('activo', true)
                ->orderBy('orden')
                ->orderBy('nombre')
                ->get()
                ->map(fn (EspecieMascota $especie) => $this->presentarEspecie($especie)),
            'slots' => collect(MascotaSlot::cases())->map(fn (MascotaSlot $slot) => [
                'codigo' => $slot->value,
                'etiqueta' => $slot->etiqueta(),
                'orden_sugerido' => $slot->ordenSugerido(),
            ]),
            'cosmeticos' => $cosmeticos,
            'resumen' => [
                'poseidos' => $cosmeticos->where('poseido', true)->count(),
                'equipados' => $equipados->count(),
                'disponibles' => $cosmeticos->where('poseido', false)->where('compatible', true)->count(),
            ],
        ];
    }

    public function actualizar(Usuario $alumno, array $datos): array
    {
        DB::transaction(function () use ($alumno, $datos) {
            $mascota = MascotaAlumno::where('id_alumno', $alumno->id)->lockForUpdate()->first()
                ?? $this->obtenerOCrear($alumno);

            if (array_key_exists('id_especie', $datos) && (int) $datos['id_especie'] !== $mascota->id_especie) {
                $especie = EspecieMascota::whereKey($datos['id_especie'])->where('activo', true)->firstOrFail();
                $compatibles = DB::table('mascota_compatibilidades')
                    ->where('id_especie', $especie->id)
                    ->pluck('id_cosmetico');
                EquipamientoMascota::where('id_mascota', $mascota->id)
                    ->whereNotIn('id_cosmetico', $compatibles)
                    ->delete();
                $mascota->id_especie = $especie->id;
            }

            if (array_key_exists('nombre', $datos)) {
                $mascota->nombre = trim((string) $datos['nombre']) ?: 'Nexo';
            }

            $mascota->save();
        }, 3);

        return $this->estado($alumno);
    }

    public function equipar(Usuario $alumno, int $cosmeticoId): array
    {
        DB::transaction(function () use ($alumno, $cosmeticoId) {
            $mascota = MascotaAlumno::where('id_alumno', $alumno->id)->lockForUpdate()->first()
                ?? $this->obtenerOCrear($alumno);
            $cosmetico = CosmeticoMascota::lockForUpdate()->findOrFail($cosmeticoId);

            abort_unless(
                InventarioMascota::where('id_alumno', $alumno->id)->where('id_cosmetico', $cosmetico->id)->exists(),
                422,
                'Este accesorio no pertenece a tu inventario.',
            );
            abort_unless(
                DB::table('mascota_compatibilidades')
                    ->where('id_cosmetico', $cosmetico->id)
                    ->where('id_especie', $mascota->id_especie)
                    ->exists(),
                422,
                'Este accesorio no es compatible con la criatura seleccionada.',
            );
            abort_unless(MascotaSlot::tryFrom($cosmetico->slot), 422, 'La ranura del accesorio no es valida.');

            EquipamientoMascota::updateOrCreate(
                ['id_mascota' => $mascota->id, 'slot' => $cosmetico->slot],
                ['id_cosmetico' => $cosmetico->id],
            );
        }, 3);

        return $this->estado($alumno);
    }

    public function quitar(Usuario $alumno, string $slot): array
    {
        abort_unless(MascotaSlot::tryFrom($slot), 422, 'La ranura indicada no es valida.');

        $mascota = $this->obtenerOCrear($alumno);
        EquipamientoMascota::where('id_mascota', $mascota->id)->where('slot', $slot)->delete();

        return $this->estado($alumno);
    }

    private function obtenerOCrear(Usuario $alumno): MascotaAlumno
    {
        $mascota = MascotaAlumno::where('id_alumno', $alumno->id)->first();
        if ($mascota) {
            return $mascota;
        }

        $especie = EspecieMascota::where('activo', true)->orderBy('orden')->orderBy('id')->first();
        abort_unless($especie, 503, 'El catalogo de criaturas aun no esta configurado.');

        return MascotaAlumno::firstOrCreate(
            ['id_alumno' => $alumno->id],
            ['id_especie' => $especie->id, 'nombre' => 'Nexo'],
        );
    }

    private function presentarEspecie(EspecieMascota $especie): array
    {
        return [
            'id' => $especie->id,
            'codigo' => $especie->codigo,
            'nombre' => $especie->nombre,
            'descripcion' => $especie->descripcion,
            'asset_base' => $this->archivos->url($especie->asset_base),
            'asset_miniatura' => $this->archivos->url($especie->asset_miniatura ?: $especie->asset_base),
            'lienzo' => ['ancho' => $especie->lienzo_ancho, 'alto' => $especie->lienzo_alto],
        ];
    }

    private function presentarCosmetico(CosmeticoMascota $cosmetico, bool $poseido, bool $equipado, bool $compatible): array
    {
        return [
            'id' => $cosmetico->id,
            'codigo' => $cosmetico->codigo,
            'nombre' => $cosmetico->nombre,
            'slot' => $cosmetico->slot,
            'rareza' => $cosmetico->rareza,
            'orden_capa' => $cosmetico->orden_capa,
            'asset_capa' => $this->archivos->url($cosmetico->asset_capa),
            'asset_miniatura' => $this->archivos->url($cosmetico->asset_miniatura ?: $cosmetico->asset_capa),
            'poseido' => $poseido,
            'equipado' => $equipado,
            'compatible' => $compatible,
            'tienda' => $cosmetico->premio ? [
                'id_premio' => $cosmetico->premio->id,
                'precio' => (int) $cosmetico->premio->precio,
                'stock' => (int) $cosmetico->premio->stock,
            ] : null,
            'especies' => $cosmetico->especies->map->only(['id', 'nombre'])->values(),
        ];
    }
}
