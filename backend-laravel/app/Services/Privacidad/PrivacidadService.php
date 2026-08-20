<?php

namespace App\Services\Privacidad;

use App\Models\ConsentimientoPrivacidad;
use App\Models\SolicitudPrivacidad;
use App\Models\Usuario;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class PrivacidadService
{
    /**
     * Registra una evidencia auditable sin conservar la IP ni el user-agent en claro.
     * El email del tutor se cifra con APP_KEY mediante el cast del modelo.
     *
     * @param  array<string, mixed>  $datos
     */
    public function registrarConsentimiento(
        Usuario $usuario,
        array $datos,
        ?string $ip,
        ?string $userAgent,
    ): ConsentimientoPrivacidad {
        $version = (string) config('privacy.policy_version');

        return ConsentimientoPrivacidad::query()->updateOrCreate(
            [
                'usuario_id' => $usuario->id,
                'version_politica' => $version,
            ],
            [
                'audiencia' => $datos['nivel'],
                'estado' => $datos['nivel'] === 'KIDS' ? 'tutor_declarado' : 'aceptado',
                'email_tutor' => $datos['nivel'] === 'KIDS' ? $datos['email_tutor'] : null,
                'email_tutor_hash' => $datos['nivel'] === 'KIDS' ? $this->hashEmailTutor($datos['email_tutor']) : null,
                'ip_hash' => $this->hashDato($ip),
                'user_agent_hash' => $this->hashDato($userAgent),
                'aceptado_at' => now(),
                'revocado_at' => null,
            ],
        );
    }

    public function registrarConsentimientoTutor(Usuario $tutor, ?string $ip, ?string $userAgent): ConsentimientoPrivacidad
    {
        return ConsentimientoPrivacidad::query()->updateOrCreate(
            [
                'usuario_id' => $tutor->id,
                'version_politica' => (string) config('privacy.policy_version'),
            ],
            [
                'audiencia' => 'TUTOR',
                'estado' => 'aceptado',
                'email_tutor' => null,
                'email_tutor_hash' => null,
                'ip_hash' => $this->hashDato($ip),
                'user_agent_hash' => $this->hashDato($userAgent),
                'aceptado_at' => now(),
                'revocado_at' => null,
            ],
        );
    }

    /**
     * Exporta solo datos pertenecientes al usuario. No incluye hashes de claves,
     * secretos de premios ni datos de otros estudiantes.
     *
     * @return array<string, mixed>
     */
    public function exportar(Usuario $usuario): array
    {
        return [
            'metadata' => [
                'formato' => 'DAEMON-PRIVACY-EXPORT',
                'version' => 2,
                'generado_at' => now()->toIso8601String(),
                'politica_version' => config('privacy.policy_version'),
            ],
            'cuenta' => $usuario->only([
                'id', 'nombre_completo', 'email', 'email_verified_at', 'telefono',
                'usuario', 'nivel', 'rango', 'biografia', 'fecha_registro', 'tokens',
                'experiencia', 'rol', 'id_institucion', 'id_aula', 'perfil_completo',
            ]),
            'consentimientos' => $usuario->consentimientosPrivacidad()
                ->get(['id', 'audiencia', 'version_politica', 'estado', 'email_tutor', 'aceptado_at', 'verificado_at', 'revocado_at'])
                ->toArray(),
            'actividad' => [
                'entregas' => $this->filas('entregas', 'id_alumno', $usuario->id, [
                    'id', 'id_desafio', 'archivo_url', 'estado', 'calificacion', 'puntaje_academico', 'fecha_entrega', 'comentario_docente',
                ]),
                'canjes' => $this->filas('canjes', 'id_alumno', $usuario->id, [
                    'id', 'id_premio', 'fecha', 'estado', 'visto_por_alumno',
                ]),
                'respuestas_evaluacion' => $this->filas('respuestas_examen', 'alumno_id', $usuario->id, [
                    'id', 'examen_id', 'nivel', 'respuestas', 'puntaje', 'fecha_envio',
                ]),
                'resultados_academicos' => $this->filas('resultados_calificacion', 'id_alumno', $usuario->id, [
                    'sourced_id', 'id_item_calificacion', 'intento', 'puntaje', 'puntaje_maximo', 'porcentaje',
                    'estado', 'retroalimentacion', 'entregado_at', 'calificado_at',
                ]),
                'dominio_objetivos' => $this->filas('dominios_objetivo', 'id_alumno', $usuario->id, [
                    'id_objetivo', 'porcentaje', 'nivel_dominio', 'cantidad_evidencias',
                    'ultima_evidencia_at', 'calculado_at',
                ]),
                'insignias' => $this->filas('insignias_otorgadas', 'id_alumno', $usuario->id, [
                    'id', 'id_insignia', 'fecha',
                ]),
                'mensajes_chatbot' => $this->filas('chat_mensajes', 'id_alumno', $usuario->id, [
                    'id', 'role', 'content', 'created_at',
                ]),
                'cuentos' => $this->filas('cuentos', 'id_alumno', $usuario->id),
                'modelos_ia' => $this->filas('ia_modelos', 'id_alumno', $usuario->id),
            ],
        ];
    }

    public function solicitarEliminacion(Usuario $usuario, string $confirmacion, ?string $motivo): SolicitudPrivacidad
    {
        $identificadores = array_filter([$usuario->email, $usuario->usuario]);
        $confirmado = collect($identificadores)->contains(
            fn (string $identificador): bool => hash_equals(mb_strtolower($identificador), mb_strtolower(trim($confirmacion))),
        );

        if (! $confirmado) {
            throw ValidationException::withMessages([
                'confirmacion' => 'Escribe exactamente tu correo o nombre de usuario para confirmar la solicitud.',
            ]);
        }

        return DB::transaction(function () use ($usuario, $motivo): SolicitudPrivacidad {
            $pendiente = SolicitudPrivacidad::query()
                ->where('usuario_id', $usuario->id)
                ->where('tipo', 'eliminacion')
                ->whereIn('estado', ['pendiente', 'en_revision'])
                ->lockForUpdate()
                ->first();

            if ($pendiente) {
                return $pendiente;
            }

            return SolicitudPrivacidad::query()->create([
                'usuario_id' => $usuario->id,
                'referencia_usuario_hash' => $this->hashDato((string) $usuario->getKey()),
                'tipo' => 'eliminacion',
                'estado' => 'pendiente',
                'motivo' => $motivo,
                'solicitado_at' => now(),
            ]);
        });
    }

    /**
     * @param  array{estado: string, resolucion: string}  $datos
     */
    public function resolver(SolicitudPrivacidad $solicitud, array $datos): SolicitudPrivacidad
    {
        $solicitud->update([
            'estado' => $datos['estado'],
            'resolucion' => $datos['resolucion'],
            'resuelto_at' => in_array($datos['estado'], ['completada', 'rechazada'], true) ? now() : null,
        ]);

        return $solicitud->fresh();
    }

    /**
     * @param  array<int, string>|null  $columnas
     * @return array<int, object>
     */
    private function filas(string $tabla, string $columnaUsuario, int $usuarioId, ?array $columnas = null): array
    {
        if (! Schema::hasTable($tabla)) {
            return [];
        }

        $consulta = DB::table($tabla)->where($columnaUsuario, $usuarioId)->orderBy('id');

        return $columnas ? $consulta->get($columnas)->all() : $consulta->get()->all();
    }

    private function hashDato(?string $dato): ?string
    {
        if ($dato === null || trim($dato) === '') {
            return null;
        }

        return hash_hmac('sha256', $dato, (string) config('app.key'));
    }

    public function hashEmailTutor(?string $email): ?string
    {
        if ($email === null || trim($email) === '') {
            return null;
        }

        return $this->hashDato(mb_strtolower(trim($email)));
    }
}
