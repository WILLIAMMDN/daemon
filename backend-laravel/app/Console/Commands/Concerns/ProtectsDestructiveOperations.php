<?php

namespace App\Console\Commands\Concerns;

use App\Support\EnvironmentSafety;
use LogicException;

trait ProtectsDestructiveOperations
{
    protected function authorizeDestructiveOperation(string $operation): bool
    {
        try {
            EnvironmentSafety::fromApplication()->assertDestructiveOperationAllowed($operation);

            return true;
        } catch (LogicException $exception) {
            $this->error($exception->getMessage());

            return false;
        }
    }
}
