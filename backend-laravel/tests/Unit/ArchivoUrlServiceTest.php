<?php

namespace Tests\Unit;

use App\Services\Archivo\ArchivoUrlService;
use DateTimeInterface;
use Illuminate\Support\Facades\Storage;
use Mockery;
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

    public function test_resuelve_entregas_con_url_temporal_del_bucket_privado(): void
    {
        config([
            'daemon.private_uploads_disk' => 'supabase_private',
            'daemon.private_upload_url_minutes' => 10,
        ]);
        $disk = Mockery::mock();
        $disk->shouldReceive('temporaryUrl')
            ->once()
            ->with('uploads/entregas/12/evidencia.pdf', Mockery::type(DateTimeInterface::class))
            ->andReturn('https://storage.example/signed-evidence');
        Storage::shouldReceive('disk')->once()->with('supabase_private')->andReturn($disk);

        $url = app(ArchivoUrlService::class)->url('uploads/entregas/12/evidencia.pdf');

        $this->assertSame('https://storage.example/signed-evidence', $url);
    }

    public function test_reescribe_url_publica_heredada_de_entrega_como_url_privada(): void
    {
        config(['daemon.private_uploads_disk' => 'supabase_private']);
        $disk = Mockery::mock();
        $disk->shouldReceive('temporaryUrl')->once()->andReturn('https://storage.example/signed-legacy');
        Storage::shouldReceive('disk')->once()->with('supabase_private')->andReturn($disk);

        $url = app(ArchivoUrlService::class)->url(
            'https://project.supabase.co/storage/v1/object/public/daemon-assets/uploads/entregas/12/evidencia.pdf'
        );

        $this->assertSame('https://storage.example/signed-legacy', $url);
    }
}
