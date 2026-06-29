<?php

namespace Tests\Unit;

use App\Services\Auth\FirebasePasswordResetLinkService;
use App\Services\Auth\GoogleServiceAccountTokenService;
use Illuminate\Support\Facades\Http;
use Mockery;
use Tests\TestCase;

class FirebasePasswordResetLinkServiceTest extends TestCase
{
    public function test_crea_link_de_frontend_desde_oob_link_de_firebase(): void
    {
        config([
            'services.firebase.project_id' => 'daemon-test',
            'services.firebase.password_reset_url' => 'https://daemonestudiante.web.app/restablecer-clave',
        ]);

        $google = Mockery::mock(GoogleServiceAccountTokenService::class);
        $google->shouldReceive('token')->once()->andReturn('google-access-token');

        Http::fake([
            'identitytoolkit.googleapis.com/*' => Http::response([
                'oobLink' => 'https://daemon-test.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=CODIGO_FIREBASE&apiKey=abc',
            ], 200),
        ]);

        $link = (new FirebasePasswordResetLinkService($google))->crear('alumno@example.com');

        $this->assertSame(
            'https://daemonestudiante.web.app/restablecer-clave?mode=resetPassword&oobCode=CODIGO_FIREBASE',
            $link,
        );

        Http::assertSent(fn ($request) => $request->hasHeader('Authorization', 'Bearer google-access-token')
            && $request['requestType'] === 'PASSWORD_RESET'
            && $request['email'] === 'alumno@example.com'
            && $request['returnOobLink'] === true);
    }
}
