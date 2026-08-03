<?php

namespace Tests\Unit;

use App\Support\EnvironmentSafety;
use LogicException;
use PHPUnit\Framework\TestCase;

class EnvironmentSafetyTest extends TestCase
{
    public function test_local_configuration_is_safe_with_loopback_and_demo_firebase(): void
    {
        $safety = new EnvironmentSafety($this->snapshot());

        $this->assertSame([], $safety->issues());
    }

    public function test_local_environment_rejects_production_postgres(): void
    {
        $safety = new EnvironmentSafety($this->snapshot([
            'db_host' => 'aws-1-sa-east-1.pooler.supabase.com',
            'db_database' => 'postgres',
        ]));

        $this->assertNotEmpty($safety->issues());
        $this->expectException(LogicException::class);
        $safety->assertRuntimeSafe();
    }

    public function test_testing_rejects_production_firebase(): void
    {
        $safety = new EnvironmentSafety($this->snapshot([
            'app_environment' => 'testing',
            'environment_name' => 'testing',
            'db_connection' => 'sqlite',
            'db_database' => ':memory:',
            'firebase_project' => 'daemon-a41f8',
        ]));

        $this->assertTrue(
            collect($safety->issues())->contains(
                fn (string $issue): bool => str_contains($issue, 'firebase_project'),
            ),
        );
    }

    public function test_staging_requires_isolated_buckets(): void
    {
        $safety = new EnvironmentSafety($this->snapshot([
            'app_environment' => 'staging',
            'environment_name' => 'staging',
            'db_host' => 'staging-db.internal',
            'storage_public_bucket' => 'shared-assets',
            'storage_private_bucket' => 'shared-private',
        ]));

        $this->assertTrue(collect($safety->issues())->contains(
            fn (string $issue): bool => str_contains($issue, 'storage_public_bucket'),
        ));
        $this->assertTrue(collect($safety->issues())->contains(
            fn (string $issue): bool => str_contains($issue, 'storage_private_bucket'),
        ));
    }

    public function test_production_destructive_operation_requires_exact_authorization(): void
    {
        $safety = new EnvironmentSafety($this->snapshot([
            'app_environment' => 'production',
            'environment_name' => 'production',
            'render_runtime' => true,
            'app_debug' => false,
            'db_host' => 'database.internal',
            'db_username' => 'postgres.lbxdcvsrmkkynttgwblc',
            'firebase_project' => 'daemon-a41f8',
            'app_url' => 'https://daemon-5vo1.onrender.com',
        ]));

        $this->expectException(LogicException::class);
        $safety->assertDestructiveOperationAllowed('daemon:aplicar-retencion');
    }

    /** @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    private function snapshot(array $overrides = []): array
    {
        return array_replace([
            'app_environment' => 'local',
            'environment_name' => 'development',
            'render_runtime' => false,
            'app_debug' => true,
            'db_connection' => 'pgsql',
            'db_host' => '127.0.0.1',
            'db_url' => '',
            'db_database' => 'daemon_local',
            'db_username' => 'daemon_local',
            'db_password_present' => false,
            'firebase_project' => 'demo-daemon-local',
            'firebase_credentials_present' => false,
            'app_url' => 'http://localhost:8000',
            'frontend_url' => 'http://localhost:4200',
            'uploads_disk' => 'public',
            'pusher_key' => '',
            'broadcast_connection' => 'null',
            'pusher_credentials_present' => false,
            'private_uploads_disk' => 'local',
            'storage_endpoint' => 'http://127.0.0.1:54321/storage/v1/s3',
            'storage_public_url' => 'http://127.0.0.1:54321/storage/v1/object/public/daemon-assets-local',
            'storage_public_bucket' => 'daemon-assets-local',
            'storage_private_bucket' => 'daemon-private-local',
            'storage_credentials_present' => false,
            'allow_production_destructive' => '',
        ], $overrides);
    }
}
