<?php

namespace App\Services\Seguridad;

use App\Models\ReporteContenido;
use App\Models\Usuario;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ModeracionService
{
    public function reportar(Usuario $reportante, array $datos): ReporteContenido
    {
        abort_if((int) ($datos['id_usuario_reportado'] ?? 0) === (int) $reportante->id, 422, 'No puedes reportarte a ti mismo.');
        if (! empty($datos['id_usuario_reportado']) && $reportante->rol !== 'admin') {
            $reportado = Usuario::findOrFail($datos['id_usuario_reportado']);
            abort_unless(
                ((int) $reportado->id_institucion === (int) $reportante->id_institucion && $reportante->id_institucion)
                || ((int) $reportado->id_aula === (int) $reportante->id_aula && $reportante->id_aula),
                403,
                'Solo puedes reportar participantes de tu comunidad.',
            );
        }

        return ReporteContenido::create([
            ...$datos,
            'uuid' => (string) Str::uuid(),
            'id_reportante' => $reportante->id,
            'severidad' => in_array($datos['categoria'], ['acoso', 'amenaza', 'contenido_sexual', 'autolesion'], true) ? 'high' : 'normal',
        ]);
    }

    public function bloquear(Usuario $usuario, Usuario $bloqueado): void
    {
        abort_if($usuario->is($bloqueado), 422, 'No puedes bloquearte a ti mismo.');
        DB::table('bloqueos_usuario')->insertOrIgnore([
            'id_usuario' => $usuario->id,
            'id_bloqueado' => $bloqueado->id,
            'created_at' => now(),
        ]);
    }

    public function desbloquear(Usuario $usuario, Usuario $bloqueado): void
    {
        DB::table('bloqueos_usuario')->where('id_usuario', $usuario->id)->where('id_bloqueado', $bloqueado->id)->delete();
    }

    public function resolver(Usuario $moderador, ReporteContenido $reporte, array $datos): ReporteContenido
    {
        $reporte->update([
            ...$datos,
            'id_asignado' => $moderador->id,
            'resuelto_at' => in_array($datos['estado'], ['resolved', 'dismissed'], true) ? now() : null,
        ]);

        return $reporte->fresh();
    }
}
