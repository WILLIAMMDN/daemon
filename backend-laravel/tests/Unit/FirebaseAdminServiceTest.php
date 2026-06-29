<?php

namespace Tests\Unit;

use App\Services\Auth\FirebaseAdminService;
use App\Services\Auth\GoogleServiceAccountTokenService;
use Illuminate\Support\Facades\Http;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class FirebaseAdminServiceTest extends TestCase
{
    public function test_update_password_envia_peticion_a_firebase_con_el_token_de_servicio(): void
    {
        config(['services.firebase.project_id' => 'daemon-test']);

        $google = Mockery::mock(GoogleServiceAccountTokenService::class);
        $google->shouldReceive('token')->once()->andReturn('google-access-token');

        Http::fake([
            'identitytoolkit.googleapis.com/*' => Http::response(['localId' => 'uid-1'], 200),
        ]);

        (new FirebaseAdminService($google))->updatePassword('uid-1', 'nueva-clave');

        Http::assertSent(fn ($request) => $request->url() === 'https://identitytoolkit.googleapis.com/v1/projects/daemon-test/accounts:update'
            && $request->hasHeader('Authorization', 'Bearer google-access-token')
            && ($request['localId'] ?? null) === 'uid-1'
            && ($request['password'] ?? null) === 'nueva-clave');
    }

    public function test_update_password_lanza_excepcion_si_firebase_falla(): void
    {
        config(['services.firebase.project_id' => 'daemon-test']);

        $google = Mockery::mock(GoogleServiceAccountTokenService::class);
        $google->shouldReceive('token')->andReturn('google-access-token');

        Http::fake([
            'identitytoolkit.googleapis.com/*' => Http::response([
                'error' => ['message' => 'INVALID_UID'],
            ], 400),
        ]);

        $this->expectException(RuntimeException::class);

        (new FirebaseAdminService($google))->updatePassword('uid-malo', 'nueva-clave');
    }

    public function test_update_password_lanza_excepcion_si_no_hay_project_id(): void
    {
        config(['services.firebase.project_id' => '']);

        $google = Mockery::mock(GoogleServiceAccountTokenService::class);

        $this->expectException(RuntimeException::class);

        (new FirebaseAdminService($google))->updatePassword('uid-1', 'nueva-clave');
    }
}