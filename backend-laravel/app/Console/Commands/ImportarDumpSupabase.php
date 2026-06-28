<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;
use Throwable;

class ImportarDumpSupabase extends Command
{
    protected $signature = 'daemon:importar-dump-supabase {--file=database/iaparateens_db.sql : Dump MySQL de DAEMON} {--target=pgsql : Conexion PostgreSQL/Supabase de destino} {--truncate-target : Vaciar tablas DAEMON del destino antes de importar} {--confirm : Ejecutar la importacion real; sin esto solo revisa}';

    protected $description = 'Importa el dump MySQL incluido en el proyecto hacia PostgreSQL/Supabase sin necesitar MySQL local encendido.';

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
        $target = (string) $this->option('target');
        $archivo = base_path((string) $this->option('file'));

        if (! is_file($archivo)) {
            $this->error("No se encontro el dump: {$archivo}");

            return self::FAILURE;
        }

        if (! $this->conexionDisponible($target) || ! $this->tablasDestinoPreparadas($target)) {
            return self::FAILURE;
        }

        try {
            $datos = $this->leerDump($archivo);
        } catch (Throwable $exception) {
            $this->error('No se pudo leer el dump.');
            $this->line($exception->getMessage());

            return self::FAILURE;
        }

        $this->mostrarResumen($target, $datos);

        if (! $this->option('confirm')) {
            $this->warn('Revision lista. No se importo nada porque falta --confirm.');
            $this->line('Cuando el resumen este correcto, ejecuta el mismo comando agregando --confirm.');

            return self::SUCCESS;
        }

        if (! $this->option('truncate-target') && $this->destinoTieneDatos($target)) {
            $this->error('El destino ya tiene datos en tablas DAEMON.');
            $this->line('Usa --truncate-target si quieres vaciar solo las tablas DAEMON antes de importar.');

            return self::FAILURE;
        }

        DB::connection($target)->transaction(function () use ($target, $datos): void {
            if ($this->option('truncate-target')) {
                $this->vaciarDestino($target);
            }

            foreach ($this->tablas as $tabla) {
                $filas = $datos[$tabla] ?? [];

                if ($filas === []) {
                    $this->line("{$tabla}: 0 filas en dump.");

                    continue;
                }

                foreach (array_chunk($filas, 500) as $lote) {
                    DB::connection($target)->table($tabla)->insert($lote);
                }

                $this->line("{$tabla}: ".count($filas).' filas importadas.');
            }

            $this->sincronizarSecuencias($target);
        });

        $this->newLine();
        $this->info('Dump importado a Supabase/PostgreSQL.');

        return self::SUCCESS;
    }

    private function conexionDisponible(string $target): bool
    {
        try {
            DB::connection($target)->select('select 1');

            return true;
        } catch (Throwable $exception) {
            $this->error('No se pudo abrir la conexion destino.');
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

    /**
     * @return array<string, array<int, array<string, mixed>>>
     */
    private function leerDump(string $archivo): array
    {
        $contenido = file_get_contents($archivo);

        if ($contenido === false) {
            throw new RuntimeException('No se pudo abrir el archivo.');
        }

        $sentencias = $this->extraerInserts($contenido);
        $datos = [];

        foreach ($sentencias as $sentencia) {
            if (! preg_match('/^INSERT INTO `([^`]+)` \((.*?)\) VALUES\s*(.*);$/s', trim($sentencia), $matches)) {
                continue;
            }

            $tabla = $matches[1];

            if (! in_array($tabla, $this->tablas, true)) {
                continue;
            }

            $columnas = $this->extraerColumnas($matches[2]);
            $filas = $this->extraerFilas($matches[3]);

            foreach ($filas as $fila) {
                if (count($fila) !== count($columnas)) {
                    throw new RuntimeException("Columnas y valores no coinciden en {$tabla}.");
                }

                $datos[$tabla][] = $this->normalizarFila($tabla, array_combine($columnas, $fila));
            }
        }

        return $datos;
    }

    /**
     * @return array<int, string>
     */
    private function extraerInserts(string $contenido): array
    {
        $sentencias = [];
        $lineas = preg_split('/\R/', $contenido);
        $actual = '';
        $capturando = false;

        foreach ($lineas as $linea) {
            if (str_starts_with($linea, 'INSERT INTO `')) {
                $actual = $linea."\n";
                $capturando = true;

                continue;
            }

            if (! $capturando) {
                continue;
            }

            $actual .= $linea."\n";

            if (str_ends_with(rtrim($linea), ';')) {
                $sentencias[] = $actual;
                $actual = '';
                $capturando = false;
            }
        }

        return $sentencias;
    }

    /**
     * @return array<int, string>
     */
    private function extraerColumnas(string $sql): array
    {
        preg_match_all('/`([^`]+)`/', $sql, $matches);

        return $matches[1];
    }

    /**
     * @return array<int, array<int, mixed>>
     */
    private function extraerFilas(string $sql): array
    {
        $filas = [];
        $fila = [];
        $token = '';
        $enString = false;
        $escape = false;
        $enTupla = false;
        $largo = strlen($sql);

        for ($i = 0; $i < $largo; $i++) {
            $char = $sql[$i];

            if (! $enTupla) {
                if ($char === '(') {
                    $enTupla = true;
                    $fila = [];
                    $token = '';
                }

                continue;
            }

            if ($enString) {
                $token .= $char;

                if ($escape) {
                    $escape = false;

                    continue;
                }

                if ($char === '\\') {
                    $escape = true;

                    continue;
                }

                if ($char === "'") {
                    $enString = false;
                }

                continue;
            }

            if ($char === "'") {
                $enString = true;
                $token .= $char;

                continue;
            }

            if ($char === ',') {
                $fila[] = $this->convertirValor($token);
                $token = '';

                continue;
            }

            if ($char === ')') {
                $fila[] = $this->convertirValor($token);
                $filas[] = $fila;
                $fila = [];
                $token = '';
                $enTupla = false;

                continue;
            }

            $token .= $char;
        }

        return $filas;
    }

    private function convertirValor(string $valor): mixed
    {
        $valor = trim($valor);

        if (strcasecmp($valor, 'NULL') === 0) {
            return null;
        }

        if (str_starts_with($valor, "'") && str_ends_with($valor, "'")) {
            return $this->desescaparMysql(substr($valor, 1, -1));
        }

        if (is_numeric($valor)) {
            return str_contains($valor, '.') ? (float) $valor : (int) $valor;
        }

        return $valor;
    }

    private function desescaparMysql(string $valor): string
    {
        $salida = '';
        $escape = false;
        $largo = strlen($valor);

        for ($i = 0; $i < $largo; $i++) {
            $char = $valor[$i];

            if (! $escape) {
                if ($char === '\\') {
                    $escape = true;

                    continue;
                }

                $salida .= $char;

                continue;
            }

            $salida .= match ($char) {
                '0' => "\0",
                'n' => "\n",
                'r' => "\r",
                't' => "\t",
                'b' => "\b",
                'Z' => chr(26),
                default => $char,
            };

            $escape = false;
        }

        if ($escape) {
            $salida .= '\\';
        }

        return $salida;
    }

    /**
     * @param  array<string, mixed>  $fila
     * @return array<string, mixed>
     */
    private function normalizarFila(string $tabla, array $fila): array
    {
        foreach ($fila as $columna => $valor) {
            if (in_array($columna, $this->columnasBooleanas[$tabla] ?? [], true)) {
                $fila[$columna] = $valor === null ? null : (bool) $valor;
            }

            if (in_array($columna, $this->columnasJson[$tabla] ?? [], true) && $valor === '') {
                $fila[$columna] = null;
            }
        }

        if ($tabla === 'usuarios') {
            $fila['perfil_completo'] ??= true;
        }

        return $fila;
    }

    /**
     * @param  array<string, array<int, array<string, mixed>>>  $datos
     */
    private function mostrarResumen(string $target, array $datos): void
    {
        $filas = [];

        foreach ($this->tablas as $tabla) {
            $filas[] = [
                $tabla,
                count($datos[$tabla] ?? []),
                DB::connection($target)->table($tabla)->count(),
            ];
        }

        $this->table(['tabla', 'filas dump', 'filas destino'], $filas);
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
