<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class MigrarMysqlASupabase extends Command
{
    protected $signature = 'daemon:migrar-a-supabase {--source=legacy_mysql : Conexion MySQL/MariaDB de origen} {--target=pgsql : Conexion PostgreSQL/Supabase de destino} {--chunk=500 : Filas por lote} {--truncate-target : Vaciar tablas DAEMON del destino antes de copiar} {--confirm : Ejecutar la copia real; sin esto solo revisa}';

    protected $description = 'Copia los datos actuales de DAEMON desde MySQL/MariaDB hacia PostgreSQL/Supabase sin tocar la base de origen.';

    /** @var array<int, string> */
    private array $tablas = [
        'usuarios',
        'premios',
        'examenes',
        'desafios',
        'insignias',
        'chat_live',
        'competencia_live',
        'historial_rondas',
        'leads',
        'team_members',
        'bots_alumnos',
        'canjes',
        'chat_mensajes',
        'cuentos',
        'entregas',
        'historial_movimientos',
        'ia_modelos',
        'insignias_otorgadas',
        'neuro_maze_stats',
        'preguntas',
        'premios_stock_digital',
        'respuestas_examen',
        'votos_live',
    ];

    /** @var array<string, array<int, string>> */
    private array $columnasBooleanas = [
        'canjes' => ['visto_por_alumno'],
        'desafios' => ['es_mision_nivel'],
        'usuarios' => ['perfil_completo'],
    ];

    /** @var array<string, array<int, string>> */
    private array $columnasJson = [
        'historial_rondas' => ['top_ranking'],
        'preguntas' => ['opciones'],
    ];

    public function handle(): int
    {
        $source = (string) $this->option('source');
        $target = (string) $this->option('target');
        $chunk = max(1, (int) $this->option('chunk'));

        if (! $this->conexionesDisponibles($source, $target)) {
            return self::FAILURE;
        }

        if (! $this->tablasDestinoPreparadas($target)) {
            return self::FAILURE;
        }

        $this->mostrarResumen($source, $target);

        if (! $this->option('confirm')) {
            $this->warn('Revision lista. No se copio nada porque falta --confirm.');
            $this->line('Cuando el destino este correcto, ejecuta el mismo comando agregando --confirm.');

            return self::SUCCESS;
        }

        if (! $this->option('truncate-target') && $this->destinoTieneDatos($target)) {
            $this->error('El destino ya tiene datos en tablas DAEMON.');
            $this->line('Para protegerte, no se copia encima. Usa --truncate-target si quieres vaciar primero el destino.');

            return self::FAILURE;
        }

        DB::connection($target)->transaction(function () use ($source, $target, $chunk): void {
            if ($this->option('truncate-target')) {
                $this->vaciarDestino($target);
            }

            foreach ($this->tablas as $tabla) {
                if (! Schema::connection($source)->hasTable($tabla)) {
                    $this->warn("Saltando {$tabla}: no existe en el origen.");

                    continue;
                }

                $this->copiarTabla($source, $target, $tabla, $chunk);
            }

            $this->sincronizarSecuencias($target);
        });

        $this->newLine();
        $this->info('Migracion a PostgreSQL/Supabase completada.');

        return self::SUCCESS;
    }

    private function conexionesDisponibles(string $source, string $target): bool
    {
        try {
            DB::connection($source)->select('select 1');
            DB::connection($target)->select('select 1');

            return true;
        } catch (Throwable $exception) {
            $this->error('No se pudo abrir una conexion de base de datos.');
            $this->line($exception->getMessage());

            return false;
        }
    }

    private function tablasDestinoPreparadas(string $target): bool
    {
        $faltantes = [];

        foreach ($this->tablas as $tabla) {
            if (! Schema::connection($target)->hasTable($tabla)) {
                $faltantes[] = $tabla;
            }
        }

        if ($faltantes === []) {
            return true;
        }

        $this->error('La base destino todavia no tiene todo el esquema DAEMON.');
        $this->line('Ejecuta primero: php artisan migrate');
        $this->line('Faltan: '.implode(', ', $faltantes));

        return false;
    }

    private function mostrarResumen(string $source, string $target): void
    {
        $this->newLine();
        $this->info("Origen: {$source}");
        $this->info("Destino: {$target}");
        $this->newLine();

        $filas = [];

        foreach ($this->tablas as $tabla) {
            $origen = Schema::connection($source)->hasTable($tabla)
                ? DB::connection($source)->table($tabla)->count()
                : 'no existe';

            $destino = DB::connection($target)->table($tabla)->count();

            $filas[] = [$tabla, $origen, $destino];
        }

        $this->table(['tabla', 'filas origen', 'filas destino'], $filas);
    }

    private function destinoTieneDatos(string $target): bool
    {
        foreach ($this->tablas as $tabla) {
            if (DB::connection($target)->table($tabla)->count() > 0) {
                return true;
            }
        }

        return false;
    }

    private function vaciarDestino(string $target): void
    {
        $tablas = implode(', ', array_map(
            fn (string $tabla): string => '"'.str_replace('"', '""', $tabla).'"',
            $this->tablas
        ));

        DB::connection($target)->statement("TRUNCATE TABLE {$tablas} RESTART IDENTITY CASCADE");
    }

    private function copiarTabla(string $source, string $target, string $tabla, int $chunk): void
    {
        $columnasOrigen = Schema::connection($source)->getColumnListing($tabla);
        $columnasDestino = Schema::connection($target)->getColumnListing($tabla);
        $columnas = array_values(array_intersect($columnasOrigen, $columnasDestino));

        if ($columnas === []) {
            $this->warn("Saltando {$tabla}: no hay columnas compatibles.");

            return;
        }

        $insertadas = 0;

        DB::connection($source)
            ->table($tabla)
            ->select($columnas)
            ->orderBy('id')
            ->chunk($chunk, function ($filas) use ($target, $tabla, $columnasDestino, &$insertadas): void {
                $payload = [];

                foreach ($filas as $fila) {
                    $payload[] = $this->normalizarFila($tabla, (array) $fila, $columnasDestino);
                }

                if ($payload !== []) {
                    DB::connection($target)->table($tabla)->insert($payload);
                    $insertadas += count($payload);
                }
            });

        $this->line("{$tabla}: {$insertadas} filas copiadas.");
    }

    /**
     * @param  array<string, mixed>  $fila
     * @param  array<int, string>  $columnasDestino
     * @return array<string, mixed>
     */
    private function normalizarFila(string $tabla, array $fila, array $columnasDestino): array
    {
        foreach ($fila as $columna => $valor) {
            if (in_array($columna, $this->columnasBooleanas[$tabla] ?? [], true)) {
                $fila[$columna] = $valor === null ? null : filter_var($valor, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            }

            if (in_array($columna, $this->columnasJson[$tabla] ?? [], true) && $valor === '') {
                $fila[$columna] = null;
            }
        }

        if ($tabla === 'usuarios' && in_array('perfil_completo', $columnasDestino, true) && ! array_key_exists('perfil_completo', $fila)) {
            $fila['perfil_completo'] = true;
        }

        return $fila;
    }

    private function sincronizarSecuencias(string $target): void
    {
        foreach ($this->tablas as $tabla) {
            DB::connection($target)->statement(sprintf(
                "select setval(pg_get_serial_sequence('%s', 'id'), coalesce((select max(id) from \"%s\"), 1), (select count(*) > 0 from \"%s\"))",
                str_replace("'", "''", $tabla),
                str_replace('"', '""', $tabla),
                str_replace('"', '""', $tabla),
            ));
        }
    }
}
