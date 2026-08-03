<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    public function createApplication()
    {
        // Composer puede compartir `vendor` mediante junction/symlink. Laravel
        // no debe inferir el root desde ese destino temporal durante tests.
        $_ENV['APP_BASE_PATH'] = dirname(__DIR__);
        $_SERVER['APP_BASE_PATH'] = dirname(__DIR__);

        return parent::createApplication();
    }
}
