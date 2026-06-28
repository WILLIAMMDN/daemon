<?php

namespace Tests\Unit;

use App\Services\Archivo\ArchivoUrlService;
use Tests\TestCase;

class ArchivoUrlServiceTest extends TestCase
{
    public function test_normaliza_avatar_default_y_lo_resuelve_desde_frontend(): void
    {
        config(['daemon.asset_public_url' => 'https://daemonestudiante.web.app']);

        $url = app(ArchivoUrlService::class)->url('img/bot_default.png');

        $this->assertSame('https://daemonestudiante.web.app/img/bot_default.svg', $url);
    }

    public function test_resuelve_assets_publicos_desde_frontend(): void
    {
        config(['daemon.asset_public_url' => 'https://daemonestudiante.web.app']);

        $url = app(ArchivoUrlService::class)->url('galeria/osito.jpg');

        $this->assertSame('https://daemonestudiante.web.app/galeria/osito.jpg', $url);
    }

    public function test_resuelve_uploads_desde_storage_cloud(): void
    {
        config(['daemon.asset_cloud_url' => 'https://project.supabase.co/storage/v1/object/public/daemon-assets']);

        $url = app(ArchivoUrlService::class)->url('uploads/perfiles/12/avatar/foto.png');

        $this->assertSame(
            'https://project.supabase.co/storage/v1/object/public/daemon-assets/uploads/perfiles/12/avatar/foto.png',
            $url,
        );
    }

    public function test_normaliza_storage_uploads_heredado_hacia_storage_cloud(): void
    {
        config(['daemon.asset_cloud_url' => 'https://project.supabase.co/storage/v1/object/public/daemon-assets']);

        $url = app(ArchivoUrlService::class)->url('storage/uploads/bots/12/avatar/bot.png');

        $this->assertSame(
            'https://project.supabase.co/storage/v1/object/public/daemon-assets/uploads/bots/12/avatar/bot.png',
            $url,
        );
    }
}
