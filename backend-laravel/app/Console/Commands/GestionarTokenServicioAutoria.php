<?php

namespace App\Console\Commands;

use App\Models\Usuario;
use App\Support\Autoria\AlcanceAutoria;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * Emisión, listado y revocación de tokens de servicio de autoría.
 *
 * Es el único camino soportado para que un cliente headless (el DAEMON Course
 * MCP, hoy) obtenga credenciales: un token Sanctum hasheado, con caducidad
 * explícita, alcances mínimos y un actor académico real detrás. Nunca emite
 * `course:publish`: publicar sigue siendo un acto humano en Course Studio.
 */
class GestionarTokenServicioAutoria extends Command
{
    protected $signature = 'autoria:token
        {accion : emitir|listar|revocar}
        {--actor= : email, usuario o id del actor académico (docente/admin)}
        {--nombre=daemon-course-mcp : nombre del token}
        {--dias=90 : días de vigencia del token emitido}
        {--alcances= : lista separada por comas; por defecto course:read,course:write}
        {--id= : id del token a revocar}';

    protected $description = 'Emite, lista o revoca tokens de servicio de la API canónica de autoría de cursos.';

    public function handle(): int
    {
        return match ($this->argument('accion')) {
            'emitir' => $this->emitir(),
            'listar' => $this->listar(),
            'revocar' => $this->revocar(),
            default => $this->fallar('Acción no reconocida. Usa emitir, listar o revocar.'),
        };
    }

    private function emitir(): int
    {
        $actor = $this->resolverActor();

        if ($actor === null) {
            return self::FAILURE;
        }

        $alcances = $this->option('alcances') === null
            ? AlcanceAutoria::porDefectoMcp()
            : AlcanceAutoria::normalizar(explode(',', (string) $this->option('alcances')));

        if ($alcances === []) {
            return $this->fallar('Ningún alcance válido. Disponibles: '.implode(', ', AlcanceAutoria::values()).'.');
        }

        if (in_array(AlcanceAutoria::PUBLICACION, $alcances, true)) {
            return $this->fallar('Un token de servicio no puede recibir '.AlcanceAutoria::PUBLICACION.': la publicación es un acto humano en Course Studio.');
        }

        $dias = max(1, (int) $this->option('dias'));
        $caduca = CarbonImmutable::now()->addDays($dias);
        $token = $actor->createToken((string) $this->option('nombre'), $alcances, $caduca);

        $this->info('Token de servicio emitido.');
        $this->table(
            ['id', 'actor', 'rol', 'institución', 'alcances', 'caduca'],
            [[
                $token->accessToken->getKey(),
                $actor->email ?? $actor->usuario,
                $actor->rol,
                $actor->id_institucion,
                implode(' ', $alcances),
                $caduca->toIso8601ZuluString(),
            ]],
        );
        $this->newLine();
        $this->warn('Se muestra una sola vez. Guárdalo en DAEMON_MCP_TOKEN y nunca lo comitees.');
        $this->line($token->plainTextToken);

        return self::SUCCESS;
    }

    private function listar(): int
    {
        $tokens = PersonalAccessToken::query()
            ->orderByDesc('id')
            ->get()
            ->filter(fn (PersonalAccessToken $token): bool => AlcanceAutoria::esDeServicio($token->abilities));

        if ($tokens->isEmpty()) {
            $this->info('No hay tokens de servicio de autoría emitidos.');

            return self::SUCCESS;
        }

        // Nunca se muestra el valor del token: sólo existe hasheado.
        $this->table(
            ['id', 'nombre', 'actor', 'alcances', 'último uso', 'caduca'],
            $tokens->map(fn (PersonalAccessToken $token): array => [
                $token->getKey(),
                $token->name,
                optional($token->tokenable)->email ?? optional($token->tokenable)->usuario ?? '—',
                implode(' ', (array) $token->abilities),
                $token->last_used_at?->toIso8601ZuluString() ?? '—',
                $token->expires_at?->toIso8601ZuluString() ?? '—',
            ])->values()->all(),
        );

        return self::SUCCESS;
    }

    private function revocar(): int
    {
        $id = $this->option('id');

        if ($id === null) {
            return $this->fallar('Indica --id con el identificador del token a revocar.');
        }

        $token = PersonalAccessToken::find($id);

        if ($token === null || ! AlcanceAutoria::esDeServicio($token->abilities)) {
            return $this->fallar('No existe un token de servicio de autoría con ese id.');
        }

        $token->delete();
        $this->info("Token de servicio {$id} revocado.");

        return self::SUCCESS;
    }

    private function resolverActor(): ?Usuario
    {
        $referencia = trim((string) $this->option('actor'));

        if ($referencia === '') {
            $this->error('Indica --actor con el email, usuario o id del actor académico.');

            return null;
        }

        $actor = Usuario::query()
            ->where('email', $referencia)
            ->orWhere('usuario', $referencia)
            ->when(ctype_digit($referencia), fn ($consulta) => $consulta->orWhere('id', (int) $referencia))
            ->first();

        if ($actor === null) {
            $this->error("No existe un usuario con la referencia «{$referencia}».");

            return null;
        }

        if (! in_array($actor->rol, ['docente', 'admin'], true)) {
            $this->error('El actor debe tener rol docente o admin para autorizar autoría de cursos.');

            return null;
        }

        return $actor;
    }

    private function fallar(string $mensaje): int
    {
        $this->error($mensaje);

        return self::FAILURE;
    }
}
