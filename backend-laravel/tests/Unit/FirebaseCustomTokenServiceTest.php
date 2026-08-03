<?php

namespace Tests\Unit;

use App\Models\Usuario;
use App\Services\Auth\FirebaseCustomTokenService;
use App\Services\Auth\GoogleServiceAccountTokenService;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class FirebaseCustomTokenServiceTest extends TestCase
{
    private const CLIENT_EMAIL = 'daemon-test@daemon.test';

    protected function setUp(): void
    {
        parent::setUp();

        $privateKey = file_get_contents(base_path('tests/Fixtures/firebase-test-private.pem'));
        Config::set('services.firebase.service_account_base64', base64_encode(json_encode([
            'type' => 'service_account',
            'project_id' => 'daemon-test',
            'private_key_id' => 'test-key',
            'private_key' => $privateKey,
            'client_email' => self::CLIENT_EMAIL,
            'client_id' => '123456789',
        ])));
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_emite_custom_token_reutilizando_el_firebase_uid_existente(): void
    {
        $usuario = new Usuario(['firebase_uid' => 'uid-existente']);

        $token = $this->servicio()->customTokenPara($usuario);

        $claims = $this->decodificar($token);
        $this->assertSame('uid-existente', $claims->uid);
        $this->assertSame(self::CLIENT_EMAIL, $claims->iss);
        $this->assertSame(
            'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
            $claims->aud,
        );
    }

    public function test_deriva_uid_determinista_cuando_no_hay_email(): void
    {
        $usuario = new Usuario(['id' => 42, 'email' => null, 'firebase_uid' => null]);
        $usuario->id = 42;

        $token = $this->servicio()->customTokenPara($usuario);

        $this->assertSame('daemon-42', $this->decodificar($token)->uid);
    }

    public function test_reconcilia_por_email_con_la_cuenta_firebase_existente(): void
    {
        Http::fake([
            'oauth2.googleapis.com/*' => Http::response(['access_token' => 'google-access-token'], 200),
            'identitytoolkit.googleapis.com/*' => Http::response([
                'users' => [['localId' => 'uid-email-existente']],
            ], 200),
        ]);

        $usuario = new Usuario(['email' => 'alumno@daemon.test', 'firebase_uid' => null]);

        $token = $this->servicio()->customTokenPara($usuario);

        $this->assertSame('uid-email-existente', $this->decodificar($token)->uid);
    }

    public function test_cae_a_uid_determinista_si_el_lookup_falla(): void
    {
        Http::fake([
            'oauth2.googleapis.com/*' => Http::response(['access_token' => 'google-access-token'], 200),
            'identitytoolkit.googleapis.com/*' => Http::response([], 500),
        ]);

        $usuario = new Usuario(['id' => 7, 'email' => 'alumno@daemon.test', 'firebase_uid' => null]);
        $usuario->id = 7;

        $token = $this->servicio()->customTokenPara($usuario);

        $this->assertSame('daemon-7', $this->decodificar($token)->uid);
    }

    public function test_lanza_excepcion_si_no_hay_cuenta_de_servicio(): void
    {
        Config::set('services.firebase.service_account_base64', '');

        $usuario = new Usuario(['id' => 1, 'firebase_uid' => null]);
        $usuario->id = 1;

        $this->expectException(RuntimeException::class);

        $this->servicio()->customTokenPara($usuario);
    }

    private function servicio(): FirebaseCustomTokenService
    {
        return new FirebaseCustomTokenService(new GoogleServiceAccountTokenService());
    }

    private function decodificar(string $token): object
    {
        $publicKey = file_get_contents(base_path('tests/Fixtures/firebase-test-public.pem'));

        // v7: los algoritmos permitidos via Key, no como tercer argumento.
        return (object) JWT::decode($token, new Key($publicKey, 'RS256'));
    }
}
