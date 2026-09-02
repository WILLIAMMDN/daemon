<?php

namespace Tests\Feature;

use App\Models\EventoDominio;
use App\Models\Insignia;
use App\Models\PoliticaRecompensaPulse;
use App\Models\Usuario;
use App\Services\Economia\EconomiaService;
use App\Services\Gamificacion\GamificacionService;
use App\Services\Pulse\AplicadorRecompensasPulse;
use App\Services\Pulse\EvaluadorLogrosPulse;
use App\Services\Pulse\PoliticasPulse;
use App\Services\Pulse\ProcesadorEventosPulse;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class PulseEngineTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_event_awards_auditable_xp_and_daems_once_while_no_policy_awards_nothing(): void
    {
        $alumno = $this->alumno();
        $politica = $this->politica(['xp' => 40, 'daems' => 15]);
        $evento = $this->evento($alumno);
        $procesador = app(ProcesadorEventosPulse::class);

        $procesador->procesar($evento->id);
        $procesador->procesar($evento->id);

        $alumno->refresh();
        $this->assertSame(40, $alumno->experiencia);
        $this->assertSame(15, $alumno->tokens);
        $this->assertDatabaseCount('pulse_aplicaciones_politica', 1);
        $this->assertDatabaseHas('movimientos_economia', [
            'id_usuario' => $alumno->id,
            'id_evento_dominio' => $evento->id,
            'id_politica_pulse' => $politica->id,
            'moneda' => 'xp',
            'tipo_transaccion' => 'EARN',
            'variacion' => 40,
        ]);
        $this->assertDatabaseHas('movimientos_economia', [
            'id_usuario' => $alumno->id,
            'moneda' => 'daemons',
            'tipo_transaccion' => 'EARN',
            'variacion' => 15,
        ]);
        $this->actingAs($alumno)->getJson('/api/v1/alumno/pulse/transacciones')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.type', 'EARN');

        $sinPolitica = $this->evento($alumno, 'learning.path.completed');
        $procesador->procesar($sinPolitica->id);
        $this->assertSame(2, DB::table('movimientos_economia')->count());
    }

    public function test_database_constraints_and_processing_lock_make_duplicate_event_policy_application_safe(): void
    {
        $alumno = $this->alumno();
        $politica = $this->politica();
        $evento = $this->evento($alumno);
        app(ProcesadorEventosPulse::class)->procesar($evento->id);

        $aplicacion = DB::table('pulse_aplicaciones_politica')->first();
        $this->expectException(QueryException::class);
        DB::table('pulse_aplicaciones_politica')->insert([
            'id_evento_dominio' => $evento->id,
            'id_politica' => $politica->id,
            'id_usuario' => $alumno->id,
            'clave_repeticion' => $aplicacion->clave_repeticion.'-otra',
            'aplicado_at' => now(),
            'created_at' => now(),
        ]);
    }

    public function test_inactive_filtering_one_time_repeatable_and_daily_limit_semantics(): void
    {
        $alumno = $this->alumno();
        $this->politica(['clave' => 'inactive', 'activa' => false, 'xp' => 500]);
        $this->politica(['clave' => 'wrong-event', 'tipo_evento' => 'learning.course.completed', 'xp' => 500]);
        $unaVez = $this->politica(['clave' => 'once', 'repetibilidad' => 'once_per_player', 'xp' => 10, 'daems' => 0]);
        $repetible = $this->politica(['clave' => 'repeat', 'repetibilidad' => 'once_per_event', 'xp' => 3, 'daems' => 0]);
        $diaria = $this->politica(['clave' => 'daily', 'repetibilidad' => 'once_per_event', 'limite_diario' => 1, 'xp' => 2, 'daems' => 0]);

        $procesador = app(ProcesadorEventosPulse::class);
        $procesador->procesar($this->evento($alumno, ocurrido: '2026-09-01 10:00:00')->id);
        $procesador->procesar($this->evento($alumno, ocurrido: '2026-09-01 11:00:00')->id);

        $alumno->refresh();
        $this->assertSame(18, $alumno->experiencia);
        $this->assertSame(1, DB::table('pulse_aplicaciones_politica')->where('id_politica', $unaVez->id)->count());
        $this->assertSame(2, DB::table('pulse_aplicaciones_politica')->where('id_politica', $repetible->id)->count());
        $this->assertSame(1, DB::table('pulse_aplicaciones_politica')->where('id_politica', $diaria->id)->count());
    }

    public function test_failed_processing_rolls_back_rewards_and_retry_is_deterministic(): void
    {
        $alumno = $this->alumno();
        $this->politica(['xp' => 25, 'daems' => 10]);
        $evento = $this->evento($alumno);
        $fallo = new class extends EvaluadorLogrosPulse
        {
            public function evaluar(EventoDominio $evento, Usuario $usuario): int
            {
                throw new RuntimeException('fallo controlado después del ledger');
            }
        };
        $procesadorConFallo = new ProcesadorEventosPulse(
            app(PoliticasPulse::class),
            app(AplicadorRecompensasPulse::class),
            $fallo,
        );

        try {
            $procesadorConFallo->procesar($evento->id);
            $this->fail('Se esperaba un fallo controlado.');
        } catch (RuntimeException) {
            $this->assertDatabaseCount('movimientos_economia', 0);
            $this->assertDatabaseHas('pulse_procesamientos_evento', ['id_evento_dominio' => $evento->id, 'estado' => 'failed']);
        }

        app(ProcesadorEventosPulse::class)->procesar($evento->id);
        $alumno->refresh();
        $this->assertSame(25, $alumno->experiencia);
        $this->assertSame(10, $alumno->tokens);
        $this->assertDatabaseCount('pulse_aplicaciones_politica', 1);
        $this->assertDatabaseCount('movimientos_economia', 2);
    }

    public function test_streak_counts_distinct_local_days_resets_and_preserves_longest_across_timezone_boundary(): void
    {
        $alumno = $this->alumno();
        DB::table('limites_pantalla')->insert([
            'alumno_id' => $alumno->id,
            'actualizado_por' => $alumno->id,
            'max_minutos_diarios' => 90,
            'zona_horaria' => 'America/Lima',
            'activo' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->politica(['xp' => 0, 'daems' => 0, 'actividad_racha' => true]);
        $procesador = app(ProcesadorEventosPulse::class);

        $procesador->procesar($this->evento($alumno, ocurrido: '2026-09-01 23:30:00')->id);
        $procesador->procesar($this->evento($alumno, ocurrido: '2026-09-02 02:00:00')->id);
        $this->assertDatabaseHas('pulse_rachas', ['id_usuario' => $alumno->id, 'racha_actual' => 1, 'racha_maxima' => 1]);
        $this->assertSame(1, DB::table('pulse_dias_racha')->count());

        $procesador->procesar($this->evento($alumno, ocurrido: '2026-09-02 05:30:00')->id);
        $this->assertDatabaseHas('pulse_rachas', ['id_usuario' => $alumno->id, 'racha_actual' => 2, 'racha_maxima' => 2]);

        $procesador->procesar($this->evento($alumno, ocurrido: '2026-09-04 05:30:00')->id);
        $this->assertDatabaseHas('pulse_rachas', [
            'id_usuario' => $alumno->id,
            'racha_actual' => 1,
            'racha_maxima' => 2,
            'zona_horaria' => 'America/Lima',
        ]);
        $this->assertSame('2026-09-04', DB::table('pulse_rachas')->value('ultima_fecha_local')
            ? substr((string) DB::table('pulse_rachas')->value('ultima_fecha_local'), 0, 10)
            : null);
    }

    public function test_achievement_definitions_reuse_badges_and_threshold_awards_are_idempotent(): void
    {
        $alumno = $this->alumno();
        Insignia::create([
            'clave_pulse' => 'first-two-completions',
            'nombre' => 'Dos experiencias',
            'descripcion' => 'Fixture de prueba',
            'imagen' => 'img/test-achievement.svg',
            'categoria' => 'progress',
            'activa' => true,
            'repetible' => false,
            'tipo_criterio' => 'event_count',
            'configuracion_criterio' => ['umbral' => 2, 'tipos_evento' => ['learning.experience.completed']],
        ]);
        $procesador = app(ProcesadorEventosPulse::class);
        $primero = $this->evento($alumno);
        $segundo = $this->evento($alumno);

        $procesador->procesar($primero->id);
        $this->assertDatabaseCount('insignias_otorgadas', 0);
        $procesador->procesar($segundo->id);
        $procesador->procesar($segundo->id);

        $this->assertDatabaseCount('insignias_otorgadas', 1);
        $this->assertDatabaseHas('insignias_otorgadas', ['id_alumno' => $alumno->id, 'id_evento_dominio' => $segundo->id]);
        $this->actingAs($alumno)->getJson('/api/v1/alumno/pulse/logros')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.key', 'first-two-completions');
    }

    public function test_level_curve_boundaries_and_canonical_snapshot_are_backend_calculated(): void
    {
        $gamificacion = app(GamificacionService::class);
        $this->assertSame([1, 99, 1], [
            $gamificacion->progreso(99)['nivel'],
            $gamificacion->progreso(99)['experiencia_nivel'],
            $gamificacion->progreso(99)['experiencia_restante'],
        ]);
        $this->assertSame(2, $gamificacion->progreso(100)['nivel']);
        $this->assertSame(3, $gamificacion->progreso(300)['nivel']);

        $alumno = $this->alumno(experiencia: 300, tokens: 17);
        $this->actingAs($alumno)->getJson('/api/v1/alumno/pulse')
            ->assertOk()
            ->assertJsonPath('level.current', 3)
            ->assertJsonPath('xp.total', 300)
            ->assertJsonPath('daems.balance', 17)
            ->assertJsonPath('level.xpToNextLevel', 300);
    }

    public function test_daems_spending_is_typed_atomic_and_stale_retries_cannot_overdraw(): void
    {
        $alumno = $this->alumno(tokens: 20);
        $economia = app(EconomiaService::class);
        $stale = $alumno->replicate();
        $stale->id = $alumno->id;
        $stale->exists = true;

        $economia->ajustarDaemons($alumno, -15, 'test_spend', 1, $alumno, 'spend-1', 'Primera compra', [], EconomiaService::TIPO_SPEND);
        try {
            $economia->ajustarDaemons($stale, -15, 'test_spend', 2, $alumno, 'spend-2', 'Segunda compra', [], EconomiaService::TIPO_SPEND);
            $this->fail('El segundo gasto debía fallar por saldo insuficiente.');
        } catch (HttpException $e) {
            $this->assertSame(422, $e->getStatusCode());
        }

        $this->assertSame(5, $alumno->refresh()->tokens);
        $this->assertDatabaseCount('movimientos_economia', 1);
        $this->assertDatabaseHas('movimientos_economia', ['tipo_transaccion' => 'SPEND', 'variacion' => -15, 'saldo_resultante' => 5]);
    }

    public function test_pulse_migration_rolls_back_and_reapplies_without_touching_legacy_tables(): void
    {
        $migracion = require database_path('migrations/2026_09_01_020000_create_daemon_pulse_v1.php');

        $migracion->down();
        $this->assertFalse(Schema::hasTable('pulse_politicas_recompensa'));
        $this->assertTrue(Schema::hasTable('movimientos_economia'));
        $this->assertFalse(Schema::hasColumn('movimientos_economia', 'id_evento_dominio'));
        $this->assertFalse(Schema::hasColumn('insignias', 'tipo_criterio'));

        $migracion->up();
        $this->assertTrue(Schema::hasTable('pulse_politicas_recompensa'));
        $this->assertTrue(Schema::hasColumn('movimientos_economia', 'id_evento_dominio'));
        $this->assertTrue(Schema::hasColumn('insignias', 'tipo_criterio'));
    }

    private function alumno(int $experiencia = 0, int $tokens = 0): Usuario
    {
        return Usuario::create([
            'nombre_completo' => 'Alumno Pulse',
            'usuario' => 'pulse.'.Str::lower(Str::random(8)),
            'password_hash' => bcrypt('secret-123'),
            'rol' => 'alumno',
            'nivel' => 'TEENS',
            'experiencia' => $experiencia,
            'tokens' => $tokens,
        ]);
    }

    private function politica(array $cambios = []): PoliticaRecompensaPulse
    {
        return PoliticaRecompensaPulse::create(array_merge([
            'clave' => 'policy-'.Str::lower(Str::random(8)),
            'nombre' => 'Política fixture',
            'tipo_evento' => 'learning.experience.completed',
            'xp' => 10,
            'daems' => 5,
            'repetibilidad' => 'once_per_event',
            'actividad_racha' => false,
            'activa' => true,
        ], $cambios));
    }

    private function evento(Usuario $alumno, string $tipo = 'learning.experience.completed', string $ocurrido = '2026-09-01 10:00:00'): EventoDominio
    {
        return EventoDominio::create([
            'uuid' => (string) Str::uuid(),
            'clave_idempotencia' => 'test-event-'.Str::uuid(),
            'tipo' => $tipo,
            'agregado_tipo' => 'experiencia_aprendizaje',
            'agregado_id' => (string) random_int(1000, 9999999),
            'id_alumno' => $alumno->id,
            'payload' => [
                'studentId' => $alumno->id,
                'experienceId' => random_int(1000, 9999999),
                'experienceType' => 'lesson',
            ],
            'ocurrido_at' => $ocurrido,
            'created_at' => $ocurrido,
        ]);
    }
}
