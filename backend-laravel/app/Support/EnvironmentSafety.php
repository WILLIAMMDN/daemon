<?php

namespace App\Support;

use LogicException;

final class EnvironmentSafety
{
    /** @var array<string, string> */
    private const PRODUCTION_MARKERS = [
        'database' => 'lbxdcvsrmkkynttgwblc',
        'firebase' => 'daemon-a41f8',
        'api' => 'daemon-5vo1.onrender.com',
        'hosting' => 'daemonestudiante.web.app',
        'pusher' => '921d28612ceab3864425',
    ];

    /** @param array<string, mixed> $snapshot */
    public function __construct(private readonly array $snapshot) {}

    public static function fromApplication(): self
    {
        $connection = (string) config('database.default');

        return new self([
            'app_environment' => (string) app()->environment(),
            'environment_name' => (string) config('environment-safety.environment_name', ''),
            'render_runtime' => (bool) config('environment-safety.render_runtime', false),
            'app_debug' => (bool) config('app.debug', false),
            'db_connection' => $connection,
            'db_host' => (string) config("database.connections.{$connection}.host", ''),
            'db_url' => (string) config("database.connections.{$connection}.url", ''),
            'db_database' => (string) config("database.connections.{$connection}.database", ''),
            'db_username' => (string) config("database.connections.{$connection}.username", ''),
            'db_password_present' => (string) config("database.connections.{$connection}.password", '') !== '',
            'firebase_project' => (string) config('services.firebase.project_id', ''),
            'firebase_credentials_present' => collect([
                config('services.firebase.service_account_path'),
                config('services.firebase.service_account_json'),
                config('services.firebase.service_account_base64'),
            ])->contains(fn (mixed $value): bool => trim((string) $value) !== ''),
            'app_url' => (string) config('app.url', ''),
            'frontend_url' => (string) config('environment-safety.frontend_url', ''),
            'uploads_disk' => (string) config('environment-safety.uploads_disk', 'public'),
            'pusher_key' => (string) config('environment-safety.pusher_key', ''),
            'broadcast_connection' => (string) config('broadcasting.default', 'null'),
            'pusher_credentials_present' => collect([
                config('broadcasting.connections.pusher.key'),
                config('broadcasting.connections.pusher.secret'),
                config('broadcasting.connections.pusher.app_id'),
            ])->every(fn (mixed $value): bool => trim((string) $value) !== ''),
            'private_uploads_disk' => (string) config('daemon.private_uploads_disk', 'local'),
            'storage_endpoint' => (string) config('filesystems.disks.supabase.endpoint', ''),
            'storage_public_url' => (string) config('filesystems.disks.supabase.url', ''),
            'storage_public_bucket' => (string) config('filesystems.disks.supabase.bucket', ''),
            'storage_private_bucket' => (string) config('filesystems.disks.supabase_private.bucket', ''),
            'storage_credentials_present' => trim((string) config('filesystems.disks.supabase.key', '')) !== ''
                && trim((string) config('filesystems.disks.supabase.secret', '')) !== '',
            'allow_production_destructive' => (string) config(
                'environment-safety.allow_production_destructive',
                '',
            ),
        ]);
    }

    /** @return list<string> */
    public function issues(): array
    {
        $issues = [];
        $appEnvironment = strtolower($this->string('app_environment'));
        $environmentName = strtolower($this->string('environment_name'));
        $expectedEnvironmentName = $appEnvironment === 'local' ? 'development' : $appEnvironment;

        if (! in_array($appEnvironment, ['local', 'testing', 'staging', 'production'], true)) {
            $issues[] = 'APP_ENV no pertenece al contrato local/testing/staging/production.';
        }

        if ($environmentName === '' || $environmentName !== $expectedEnvironmentName) {
            $issues[] = 'DAEMON_ENVIRONMENT no coincide con APP_ENV.';
        }

        if ($appEnvironment === 'production' && ! $this->bool('render_runtime') && $environmentName !== 'production') {
            $issues[] = 'Un runtime local no puede asumir produccion de forma implicita.';
        }

        if ($appEnvironment === 'production' && $this->bool('app_debug')) {
            $issues[] = 'APP_DEBUG debe estar desactivado en produccion.';
        }

        if ($appEnvironment === 'production') {
            $matches = array_values($this->productionMatches());
            foreach (['database', 'firebase', 'api'] as $requiredResource) {
                if (! in_array($requiredResource, $matches, true)) {
                    $issues[] = "Produccion no coincide con el fingerprint esperado de {$requiredResource}.";
                }
            }
        }

        $nonProduction = in_array($appEnvironment, ['local', 'testing', 'staging'], true);
        if ($nonProduction) {
            foreach ($this->productionMatches() as $field => $label) {
                $issues[] = "{$field} reutiliza el recurso productivo {$label}.";
            }

            if ($this->string('storage_public_bucket') === 'daemon-assets') {
                $issues[] = 'storage_public_bucket reutiliza el bucket productivo.';
            }
            if ($this->string('storage_private_bucket') === 'daemon-private') {
                $issues[] = 'storage_private_bucket reutiliza el bucket productivo.';
            }
        }

        if (in_array($appEnvironment, ['local', 'testing'], true)) {
            $connection = strtolower($this->string('db_connection'));
            $host = $this->databaseHost();
            if ($connection !== 'sqlite' && $host !== '' && ! $this->isLoopback($host)) {
                $issues[] = 'La base local/testing no usa un host loopback.';
            }

            $firebase = strtolower($this->string('firebase_project'));
            if ($firebase !== '' && ! str_starts_with($firebase, 'demo-')) {
                $issues[] = 'Firebase local/testing no usa un projectId demo.';
            }
        }

        if ($appEnvironment === 'testing') {
            $connection = strtolower($this->string('db_connection'));
            $usesSqliteMemory = $connection === 'sqlite' && $this->string('db_database') === ':memory:';
            $usesEphemeralPgsql = $connection === 'pgsql' && $this->isLoopback($this->databaseHost());
            if (! $usesSqliteMemory && ! $usesEphemeralPgsql) {
                $issues[] = 'Testing debe usar SQLite en memoria o PostgreSQL efimero en loopback.';
            }

            if (! in_array($this->string('uploads_disk'), ['local', 'public'], true)) {
                $issues[] = 'Testing no puede escribir archivos en un disco remoto.';
            }
        }

        if ($appEnvironment === 'staging') {
            foreach (['storage_public_bucket', 'storage_private_bucket'] as $field) {
                $bucket = $this->string($field);
                if ($bucket !== '' && ! str_ends_with($bucket, '-staging')) {
                    $issues[] = "{$field} no identifica un bucket aislado de staging.";
                }
            }

            if (strtolower($this->string('db_connection')) !== 'pgsql') {
                $issues[] = 'Staging debe usar una conexion PostgreSQL explicita.';
            }
            foreach (['db_host', 'db_database', 'db_username', 'firebase_project'] as $field) {
                if ($this->string($field) === '') {
                    $issues[] = "{$field} es obligatorio en staging.";
                }
            }
            if (! $this->bool('db_password_present')) {
                $issues[] = 'La credencial PostgreSQL de staging no esta configurada.';
            }
            if (! $this->bool('firebase_credentials_present')) {
                $issues[] = 'La credencial Firebase de staging no esta configurada.';
            }
            foreach (['app_url', 'frontend_url', 'storage_endpoint', 'storage_public_url'] as $field) {
                if (! $this->isHttps($this->string($field))) {
                    $issues[] = "{$field} debe ser una URL HTTPS de staging.";
                }
            }
            if ($this->string('uploads_disk') !== 'supabase') {
                $issues[] = 'UPLOADS_DISK de staging debe ser supabase.';
            }
            if ($this->string('private_uploads_disk') !== 'supabase_private') {
                $issues[] = 'PRIVATE_UPLOADS_DISK de staging debe ser supabase_private.';
            }
            if (! $this->bool('storage_credentials_present')) {
                $issues[] = 'Las credenciales Storage de staging no estan configuradas.';
            }
            if ($this->string('broadcast_connection') !== 'pusher') {
                $issues[] = 'BROADCAST_CONNECTION de staging debe ser pusher.';
            }
            if (! $this->bool('pusher_credentials_present')) {
                $issues[] = 'Las credenciales Pusher de staging no estan configuradas.';
            }
        }

        return array_values(array_unique($issues));
    }

    public function assertRuntimeSafe(): void
    {
        $issues = $this->issues();
        if ($issues !== []) {
            throw new LogicException('DAEMON bloqueo el entorno: '.implode(' ', $issues));
        }
    }

    public function assertDestructiveOperationAllowed(string $operation): void
    {
        $this->assertRuntimeSafe();

        $isProduction = strtolower($this->string('app_environment')) === 'production'
            || $this->productionMatches() !== [];
        if (! $isProduction) {
            return;
        }

        if (! hash_equals($operation, $this->string('allow_production_destructive'))) {
            throw new LogicException(
                "DAEMON bloqueo {$operation}: falta autorizacion productiva exacta y temporal.",
            );
        }
    }

    /** @return array<string, string> */
    private function productionMatches(): array
    {
        $matches = [];
        foreach ([
            'db_host',
            'db_url',
            'db_database',
            'db_username',
            'firebase_project',
            'app_url',
            'frontend_url',
            'storage_endpoint',
            'storage_public_url',
            'storage_public_bucket',
            'storage_private_bucket',
            'pusher_key',
        ] as $field) {
            $value = strtolower($this->string($field));
            foreach (self::PRODUCTION_MARKERS as $label => $marker) {
                if ($value !== '' && str_contains($value, $marker)) {
                    $matches[$field] = $label;
                }
            }
        }

        return $matches;
    }

    private function databaseHost(): string
    {
        $url = $this->string('db_url');
        if ($url !== '') {
            return strtolower((string) (parse_url($url, PHP_URL_HOST) ?: ''));
        }

        return strtolower($this->string('db_host'));
    }

    private function isLoopback(string $host): bool
    {
        return in_array($host, ['localhost', '127.0.0.1', '::1'], true);
    }

    private function isHttps(string $value): bool
    {
        return $value !== '' && strtolower((string) parse_url($value, PHP_URL_SCHEME)) === 'https';
    }

    private function string(string $key): string
    {
        return trim((string) ($this->snapshot[$key] ?? ''));
    }

    private function bool(string $key): bool
    {
        return filter_var($this->snapshot[$key] ?? false, FILTER_VALIDATE_BOOL);
    }
}
