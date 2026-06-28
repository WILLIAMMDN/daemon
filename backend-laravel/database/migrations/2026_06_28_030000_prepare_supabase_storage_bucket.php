<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private string $bucket = 'daemon-assets';

    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql' || ! $this->tablaStorageExiste()) {
            return;
        }

        DB::statement(<<<'SQL'
            insert into storage.buckets (id, name, public, file_size_limit, avif_autodetection)
            values (?, ?, true, 52428800, false)
            on conflict (id) do update
                set name = excluded.name,
                    public = true,
                    file_size_limit = excluded.file_size_limit,
                    avif_autodetection = false,
                    updated_at = now()
        SQL, [$this->bucket, $this->bucket]);

        $this->crearPolitica(
            'daemon_assets_public_read',
            "create policy daemon_assets_public_read on storage.objects for select to public using (bucket_id = '{$this->bucket}')"
        );

        $this->crearPolitica(
            'daemon_assets_service_role_write',
            "create policy daemon_assets_service_role_write on storage.objects for all to service_role using (bucket_id = '{$this->bucket}') with check (bucket_id = '{$this->bucket}')"
        );
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql' || ! $this->tablaStorageExiste()) {
            return;
        }

        DB::statement('drop policy if exists daemon_assets_public_read on storage.objects');
        DB::statement('drop policy if exists daemon_assets_service_role_write on storage.objects');
    }

    private function tablaStorageExiste(): bool
    {
        return (bool) DB::selectOne("select to_regclass('storage.buckets') is not null as existe")->existe;
    }

    private function crearPolitica(string $nombre, string $sql): void
    {
        $existe = (bool) DB::selectOne(
            "select exists (
                select 1
                from pg_policies
                where schemaname = 'storage'
                    and tablename = 'objects'
                    and policyname = ?
            ) as existe",
            [$nombre]
        )->existe;

        if (! $existe) {
            DB::statement($sql);
        }
    }
};
