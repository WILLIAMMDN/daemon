<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private string $privateBucket = 'daemon-private';

    public function up(): void
    {
        $this->preparePrivateBucket();
        $this->encryptRewardSecrets();
    }

    public function down(): void
    {
        $this->decryptRewardSecrets();

        if (DB::getDriverName() === 'pgsql' && $this->storageTablesExist()) {
            DB::statement('drop policy if exists daemon_private_service_role_access on storage.objects');
        }
    }

    private function preparePrivateBucket(): void
    {
        if (DB::getDriverName() !== 'pgsql' || ! $this->storageTablesExist()) {
            return;
        }

        DB::statement(<<<'SQL'
            insert into storage.buckets (id, name, public, file_size_limit, avif_autodetection)
            values (?, ?, false, 52428800, false)
            on conflict (id) do update
                set name = excluded.name,
                    public = false,
                    file_size_limit = excluded.file_size_limit,
                    avif_autodetection = false,
                    updated_at = now()
        SQL, [$this->privateBucket, $this->privateBucket]);

        $exists = (bool) DB::selectOne(<<<'SQL'
            select exists (
                select 1 from pg_policies
                where schemaname = 'storage'
                  and tablename = 'objects'
                  and policyname = 'daemon_private_service_role_access'
            ) as exists
        SQL)->exists;

        if (! $exists) {
            DB::statement(
                "create policy daemon_private_service_role_access on storage.objects for all to service_role using (bucket_id = '{$this->privateBucket}') with check (bucket_id = '{$this->privateBucket}')"
            );
        }
    }

    private function encryptRewardSecrets(): void
    {
        if (! Schema::hasTable('premios') || ! Schema::hasColumn('premios', 'datos_secretos')) {
            return;
        }

        DB::table('premios')
            ->whereNotNull('datos_secretos')
            ->orderBy('id')
            ->each(function (object $reward): void {
                $value = (string) $reward->datos_secretos;
                if ($value === '' || $this->isEncrypted($value)) {
                    return;
                }

                DB::table('premios')->where('id', $reward->id)->update([
                    'datos_secretos' => Crypt::encryptString($value),
                ]);
            });
    }

    private function decryptRewardSecrets(): void
    {
        if (! Schema::hasTable('premios') || ! Schema::hasColumn('premios', 'datos_secretos')) {
            return;
        }

        DB::table('premios')
            ->whereNotNull('datos_secretos')
            ->orderBy('id')
            ->each(function (object $reward): void {
                try {
                    $plain = Crypt::decryptString((string) $reward->datos_secretos);
                } catch (\Throwable) {
                    return;
                }

                DB::table('premios')->where('id', $reward->id)->update([
                    'datos_secretos' => $plain,
                ]);
            });
    }

    private function isEncrypted(string $value): bool
    {
        try {
            Crypt::decryptString($value);

            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    private function storageTablesExist(): bool
    {
        return (bool) DB::selectOne("select to_regclass('storage.buckets') is not null as exists")->exists;
    }
};
