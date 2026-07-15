<?php

namespace App\Services\Familias;

use App\Models\ConsentimientoPrivacidad;
use App\Models\LimitePantalla;
use App\Models\MembresiaFamiliar;
use App\Models\TutorAlumno;
use App\Models\Usuario;
use App\Services\Gamificacion\GamificacionService;
use App\Services\Gamificacion\RankingService;
use App\Services\Privacidad\PrivacidadService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TutorPortalService
{
    public function __construct(
        private readonly PrivacidadService $privacidad,
        private readonly RankingService $ranking,
        private readonly GamificacionService $gamificacion,
        private readonly BienestarDigitalService $bienestar,
    ) {}

    /** @return array<int, array<string, mixed>> */
    public function invitaciones(Usuario $tutor): array
    {
        $this->asegurarTutorVerificado($tutor);
        $this->hidratarHashesLegados($tutor);
        $hash = $this->privacidad->hashEmailTutor($tutor->email);

        return ConsentimientoPrivacidad::query()
            ->with('usuario:id,nombre_completo,nivel')
            ->where('email_tutor_hash', $hash)
            ->where('audiencia', 'KIDS')
            ->where('estado', 'tutor_declarado')
            ->whereNull('revocado_at')
            ->orderByDesc('aceptado_at')
            ->get()
            ->map(fn (ConsentimientoPrivacidad $consentimiento): array => [
                'id' => $consentimiento->id,
                'alumno' => $this->nombreProtegido((string) $consentimiento->usuario?->nombre_completo),
                'nivel' => $consentimiento->usuario?->nivel,
                'declarado_at' => $consentimiento->aceptado_at?->toIso8601String(),
            ])
            ->values()
            ->all();
    }

    public function aceptar(Usuario $tutor, ConsentimientoPrivacidad $consentimiento, string $parentesco): TutorAlumno
    {
        $this->asegurarTutorVerificado($tutor);

        return DB::transaction(function () use ($tutor, $consentimiento, $parentesco): TutorAlumno {
            $consentimiento = ConsentimientoPrivacidad::query()->lockForUpdate()->findOrFail($consentimiento->id);
            $hashTutor = $this->privacidad->hashEmailTutor($tutor->email);
            $hashConsentimiento = $consentimiento->email_tutor_hash
                ?: $this->privacidad->hashEmailTutor($consentimiento->email_tutor);

            if (! $hashTutor || ! $hashConsentimiento || ! hash_equals($hashConsentimiento, $hashTutor)) {
                throw ValidationException::withMessages([
                    'consentimiento' => 'Esta invitacion no corresponde al correo verificado de tu cuenta.',
                ]);
            }

            if ($consentimiento->audiencia !== 'KIDS' || $consentimiento->revocado_at) {
                throw ValidationException::withMessages([
                    'consentimiento' => 'La invitacion ya no esta disponible.',
                ]);
            }

            $alumno = $consentimiento->usuario;
            abort_unless($alumno && $alumno->rol === 'alumno', 422, 'La cuenta KIDS ya no esta activa.');

            $vinculo = TutorAlumno::query()->updateOrCreate(
                ['tutor_id' => $tutor->id, 'alumno_id' => $alumno->id],
                [
                    'consentimiento_id' => $consentimiento->id,
                    'parentesco' => $parentesco,
                    'estado' => 'activo',
                    'verificado_at' => now(),
                ],
            );

            $consentimiento->update([
                'email_tutor_hash' => $hashConsentimiento,
                'estado' => 'verificado',
                'verificado_at' => now(),
            ]);

            LimitePantalla::query()->firstOrCreate(
                ['alumno_id' => $alumno->id],
                [
                    'actualizado_por' => $tutor->id,
                    'max_minutos_diarios' => 90,
                    'zona_horaria' => config('daemon.familias.zona_horaria', 'America/Lima'),
                    'activo' => false,
                ],
            );

            return $vinculo->fresh('alumno');
        });
    }

    /** @return array<string, mixed> */
    public function panel(Usuario $tutor, ?int $alumnoId = null): array
    {
        $this->asegurarTutorVerificado($tutor);
        $vinculos = TutorAlumno::query()
            ->with('alumno.aula')
            ->where('tutor_id', $tutor->id)
            ->where('estado', 'activo')
            ->orderBy('id')
            ->get();

        $seleccion = $alumnoId
            ? $vinculos->firstWhere('alumno_id', $alumnoId)
            : $vinculos->first();

        if ($alumnoId && ! $seleccion) {
            abort(403, 'No tienes acceso al reporte de este alumno.');
        }

        $hijos = $vinculos->map(fn (TutorAlumno $vinculo): array => [
            'id' => $vinculo->alumno->id,
            'nombre' => $vinculo->alumno->nombre_completo ?: 'Estudiante DAEMON',
            'nivel' => $vinculo->alumno->nivel,
            'avatar' => $vinculo->alumno->avatar,
            'aula' => $vinculo->alumno->aula?->nombre,
            'parentesco' => $vinculo->parentesco,
        ])->values()->all();

        return [
            'tutor' => ['nombre' => $tutor->nombre_completo, 'email' => $tutor->email],
            'hijos' => $hijos,
            'seleccionado' => $seleccion ? $this->reporteAlumno($seleccion->alumno) : null,
            'invitaciones_pendientes' => count($this->invitaciones($tutor)),
        ];
    }

    /** @param array<string, mixed> $datos */
    public function actualizarLimite(Usuario $tutor, Usuario $alumno, array $datos): array
    {
        $this->asegurarAcceso($tutor, $alumno);

        LimitePantalla::query()->updateOrCreate(
            ['alumno_id' => $alumno->id],
            [
                ...$datos,
                'actualizado_por' => $tutor->id,
                'hora_silencio_inicio' => $datos['hora_silencio_inicio'] ?? null,
                'hora_silencio_fin' => $datos['hora_silencio_fin'] ?? null,
            ],
        );

        return $this->bienestar->estadoPara($alumno);
    }

    private function asegurarTutorVerificado(Usuario $tutor): void
    {
        abort_unless($tutor->rol === 'tutor', 403, 'Este recurso pertenece al portal familiar.');
        abort_unless($tutor->hasVerifiedEmail(), 403, 'Verifica tu correo en Firebase antes de vincular a un menor.');
    }

    private function asegurarAcceso(Usuario $tutor, Usuario $alumno): void
    {
        $this->asegurarTutorVerificado($tutor);
        abort_unless(
            TutorAlumno::query()->where('tutor_id', $tutor->id)->where('alumno_id', $alumno->id)->where('estado', 'activo')->exists(),
            403,
            'No tienes acceso a este alumno.',
        );
    }

    private function hidratarHashesLegados(Usuario $tutor): void
    {
        $hashTutor = $this->privacidad->hashEmailTutor($tutor->email);
        if (! $hashTutor) {
            return;
        }

        ConsentimientoPrivacidad::query()
            ->where('audiencia', 'KIDS')
            ->whereNull('email_tutor_hash')
            ->whereNull('revocado_at')
            ->limit(1000)
            ->get()
            ->each(function (ConsentimientoPrivacidad $consentimiento) use ($hashTutor): void {
                try {
                    $hash = $this->privacidad->hashEmailTutor($consentimiento->email_tutor);
                    if ($hash && hash_equals($hash, $hashTutor)) {
                        $consentimiento->update(['email_tutor_hash' => $hash]);
                    }
                } catch (\Throwable) {
                    // Un registro cifrado con una llave antigua no bloquea el resto de invitaciones.
                }
            });
    }

    /** @return array<string, mixed> */
    private function reporteAlumno(Usuario $alumno): array
    {
        $inicio = now()->subDays(6)->startOfDay();
        $fin = now()->endOfDay();
        $entregas = DB::table('entregas as e')
            ->join('desafios as d', 'd.id', '=', 'e.id_desafio')
            ->where('e.id_alumno', $alumno->id)
            ->where('e.estado', 'aprobado')
            ->whereBetween(DB::raw('COALESCE(e.fecha_revision, e.fecha_entrega)'), [$inicio, $fin])
            ->orderByDesc(DB::raw('COALESCE(e.fecha_revision, e.fecha_entrega)'))
            ->get([
                'd.titulo', 'd.recompensa',
                DB::raw('COALESCE(e.fecha_revision, e.fecha_entrega) as fecha_actividad'),
            ]);
        $fechasActivas = $entregas->map(fn ($entrega): string => CarbonImmutable::parse($entrega->fecha_actividad)->toDateString())->unique();
        $progreso = $this->gamificacion->progreso((int) $alumno->experiencia);
        $alcance = $this->ranking->alcanceDe($alumno);
        $membresia = MembresiaFamiliar::query()->where('alumno_id', $alumno->id)->first();
        $portalPagos = (string) config('daemon.familias.portal_pagos_url', '');
        $portalPagos = str_starts_with($portalPagos, 'https://') ? $portalPagos : null;
        $soporteEmail = (string) config('daemon.familias.soporte_email', '');
        $soporteEmail = filter_var($soporteEmail, FILTER_VALIDATE_EMAIL) && ! str_ends_with($soporteEmail, '.local')
            ? $soporteEmail
            : null;

        return [
            'alumno' => [
                'id' => $alumno->id,
                'nombre' => $alumno->nombre_completo ?: 'Estudiante DAEMON',
                'nivel' => $alumno->nivel,
                'avatar' => $alumno->avatar,
                'experiencia' => (int) $alumno->experiencia,
                'nivel_gamificacion' => $progreso['nivel'],
                'progreso_nivel' => $progreso,
                'posicion' => $this->ranking->posicionDe($alumno),
                'posicion_scope_label' => $alcance['etiqueta'],
            ],
            'semana' => [
                'misiones_aprobadas' => $entregas->count(),
                'xp_aprendizaje' => (int) $entregas->sum('recompensa'),
                'evaluaciones_enviadas' => DB::table('respuestas_examen')
                    ->where('alumno_id', $alumno->id)->whereBetween('fecha_envio', [$inicio, $fin])->count(),
                'promedio_evaluaciones' => round((float) DB::table('respuestas_examen')
                    ->where('alumno_id', $alumno->id)->whereBetween('fecha_envio', [$inicio, $fin])->avg('puntaje'), 1),
                'actividad' => collect(range(6, 0))->map(function (int $dias) use ($fechasActivas): array {
                    $fecha = CarbonImmutable::now()->subDays($dias);

                    return [
                        'fecha' => $fecha->toDateString(),
                        'etiqueta' => ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'][$fecha->dayOfWeek],
                        'activo' => $fechasActivas->contains($fecha->toDateString()),
                    ];
                })->all(),
                'ultimas_misiones' => $entregas->take(5)->map(fn ($entrega): array => [
                    'titulo' => $entrega->titulo,
                    'xp' => (int) $entrega->recompensa,
                    'fecha' => CarbonImmutable::parse($entrega->fecha_actividad)->toDateString(),
                ])->values()->all(),
            ],
            'bienestar_digital' => $this->bienestar->estadoPara($alumno),
            'membresia' => [
                'plan' => $membresia?->plan ?? 'Sin plan registrado',
                'estado' => $membresia?->estado ?? 'sin_configurar',
                'importe_centimos' => $membresia?->importe_centimos,
                'moneda' => $membresia?->moneda ?? 'PEN',
                'ultimo_pago_at' => $membresia?->ultimo_pago_at?->toIso8601String(),
                'proximo_pago_at' => $membresia?->proximo_pago_at?->toIso8601String(),
                'portal_pago_url' => $portalPagos,
                'soporte_email' => $soporteEmail,
                'maneja_tarjetas_daemon' => false,
            ],
        ];
    }

    private function nombreProtegido(string $nombre): string
    {
        $partes = preg_split('/\s+/', trim($nombre)) ?: [];

        return trim(($partes[0] ?? 'Estudiante').' '.(isset($partes[1]) ? mb_substr($partes[1], 0, 1).'.' : ''));
    }
}
