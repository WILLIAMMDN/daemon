<?php

namespace App\Console\Commands;

use App\Support\EnvironmentSafety;
use Illuminate\Console\Command;

class CheckEnvironmentSafety extends Command
{
    protected $signature = 'daemon:check-environment-safety
        {--operation=read : read, deploy o destructive}';

    protected $description = 'Verifica que DAEMON no mezcle recursos entre entornos';

    public function handle(): int
    {
        $operation = strtolower((string) $this->option('operation'));
        if (! in_array($operation, ['read', 'deploy', 'destructive'], true)) {
            $this->error('Operation invalida. Usa read, deploy o destructive.');

            return self::INVALID;
        }

        $safety = EnvironmentSafety::fromApplication();
        $safety->assertRuntimeSafe();
        if ($operation === 'destructive') {
            $safety->assertDestructiveOperationAllowed($this->getName());
        }

        $this->info('OK: el entorno Laravel es coherente y esta aislado.');

        return self::SUCCESS;
    }
}
