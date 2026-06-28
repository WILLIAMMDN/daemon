<?php

namespace Tests\Unit;

use App\Services\Auth\FirebaseTokenVerifier;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Tests\TestCase;
use UnexpectedValueException;

class FirebaseTokenVerifierTest extends TestCase
{
    private const PROJECT_ID = 'daemon-test';
    private const KID = 'test-kid-1';
    private const CERT_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

    private string $llavePrivada;
    private string $llavePrivadaOtra;
    private string $certificadoPem;

    protected function setUp(): void
    {
        parent::setUp();

        $this->llavePrivada = (string) file_get_contents(__DIR__.'/../Fixtures/firebase-test-private.pem');
        $this->llavePrivadaOtra = (string) file_get_contents(__DIR__.'/../Fixtures/firebase-test-other-private.pem');
        $this->certificadoPem = (string) file_get_contents(__DIR__.'/../Fixtures/firebase-test-public.pem');

        config()->set('services.firebase.project_id', self::PROJECT_ID);
        config()->set('services.firebase.certificates_url', self::CERT_URL);

        Cache::forget('firebase.id_token_certificates');
    }

    public function test_devuelve_claims_cuando_el_token_es_valido(): void
    {
        $this->fingirCertificados();

        $token = $this->firmar([
            'iss' => 'https://securetoken.google.com/'.self::PROJECT_ID,
            'aud' => self::PROJECT_ID,
            'sub' => 'firebase-uid-abc',
            'email' => 'alumno@example.com',
            'email_verified' => true,
            'name' => 'Alumno Demo',
            'picture' => 'https://example.com/avatar.png',
            'firebase' => [
                'sign_in_provider' => 'password',
                'identities' => [],
            ],
            'iat' => time() - 10,
            'exp' => time() + 3600,
            'auth_time' => time() - 5,
        ]);

        $claims = app(FirebaseTokenVerifier::class)->verify($token);

        $this->assertSame('firebase-uid-abc', $claims['uid']);
        $this->assertSame('alumno@example.com', $claims['email']);
        $this->assertTrue($claims['email_verified']);
        $this->assertSame('Alumno Demo', $claims['name']);
        $this->assertSame('https://example.com/avatar.png', $claims['picture']);
        $this->assertSame('password', $claims['provider']);
    }

    public function test_extrae_identidad_de_google_cuando_existe(): void
    {
        $this->fingirCertificados();

        $token = $this->firmar([
            'iss' => 'https://securetoken.google.com/'.self::PROJECT_ID,
            'aud' => self::PROJECT_ID,
            'sub' => 'firebase-uid-xyz',
            'email' => 'google@example.com',
            'email_verified' => true,
            'firebase' => [
                'sign_in_provider' => 'google.com',
                'identities' => [
                    'google.com' => ['google-id-123'],
                ],
            ],
            'iat' => time() - 10,
            'exp' => time() + 3600,
            'auth_time' => time() - 5,
        ]);

        $claims = app(FirebaseTokenVerifier::class)->verify($token);

        $this->assertSame('google.com', $claims['provider']);
        $this->assertSame('google-id-123', $claims['google_id']);
    }

    public function test_rechaza_token_firmado_por_otra_llave(): void
    {
        $this->fingirCertificados();

        $token = JWT::encode($this->claimsBase(), $this->llavePrivadaOtra, 'RS256', self::KID);

        $this->expectException(UnexpectedValueException::class);
        $this->expectExceptionMessage('Signature verification failed');

        app(FirebaseTokenVerifier::class)->verify($token);
    }

    public function test_rechaza_token_con_aud_incorrecto(): void
    {
        $this->fingirCertificados();

        $token = $this->firmar(array_merge($this->claimsBase(), [
            'aud' => 'otro-proyecto',
        ]));

        $this->expectException(UnexpectedValueException::class);
        $this->expectExceptionMessage('no pertenece a este proyecto');

        app(FirebaseTokenVerifier::class)->verify($token);
    }

    public function test_rechaza_token_con_iss_incorrecto(): void
    {
        $this->fingirCertificados();

        $token = $this->firmar(array_merge($this->claimsBase(), [
            'iss' => 'https://otro-emisor.example.com/'.self::PROJECT_ID,
        ]));

        $this->expectException(UnexpectedValueException::class);
        $this->expectExceptionMessage('no pertenece a este proyecto');

        app(FirebaseTokenVerifier::class)->verify($token);
    }

    public function test_rechaza_token_sin_sub(): void
    {
        $this->fingirCertificados();

        $payload = $this->claimsBase();
        unset($payload['sub']);

        $token = $this->firmar($payload);

        $this->expectException(UnexpectedValueException::class);
        $this->expectExceptionMessage('no contiene un usuario valido');

        app(FirebaseTokenVerifier::class)->verify($token);
    }

    public function test_rechaza_token_con_sub_demasiado_largo(): void
    {
        $this->fingirCertificados();

        $token = $this->firmar(array_merge($this->claimsBase(), [
            'sub' => str_repeat('a', 129),
        ]));

        $this->expectException(UnexpectedValueException::class);
        $this->expectExceptionMessage('no contiene un usuario valido');

        app(FirebaseTokenVerifier::class)->verify($token);
    }

    public function test_rechaza_auth_time_en_el_futuro(): void
    {
        $this->fingirCertificados();

        $token = $this->firmar(array_merge($this->claimsBase(), [
            'auth_time' => time() + 60,
        ]));

        $this->expectException(UnexpectedValueException::class);
        $this->expectExceptionMessage('todavia no es valida');

        app(FirebaseTokenVerifier::class)->verify($token);
    }

    public function test_rechaza_kid_desconocido_y_limpia_cache(): void
    {
        $this->fingirCertificados();

        $tokenConOtroKid = JWT::encode(
            $this->claimsBase(),
            $this->llavePrivada,
            'RS256',
            'kid-que-no-existe',
        );

        $verifier = app(FirebaseTokenVerifier::class);

        try {
            $verifier->verify($tokenConOtroKid);
            $this->fail('Se esperaba UnexpectedValueException por kid desconocido.');
        } catch (UnexpectedValueException $exception) {
            $this->assertStringContainsString('No se encontro la llave publica de Firebase.', $exception->getMessage());
        }

        $this->assertFalse(Cache::has('firebase.id_token_certificates'));

        $tokenValido = $this->firmar($this->claimsBase());
        $claims = $verifier->verify($tokenValido);

        $this->assertSame($this->claimsBase()['sub'], $claims['uid']);
    }

    public function test_cachea_las_llaves_publicas_entre_llamadas(): void
    {
        Http::fake([
            self::CERT_URL => Http::response([self::KID => $this->certificadoPem], 200, [
                'Cache-Control' => 'public, max-age=3600',
            ]),
        ]);

        $token = $this->firmar($this->claimsBase());

        $verifier = app(FirebaseTokenVerifier::class);

        $verifier->verify($token);
        $verifier->verify($token);

        Http::assertSentCount(1);
    }

    public function test_falla_si_firebase_no_esta_configurado_en_el_backend(): void
    {
        config()->set('services.firebase.project_id', '');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Firebase no esta configurado en el backend.');

        app(FirebaseTokenVerifier::class)->verify('cualquier.cosa');
    }

    public function test_falla_si_no_puede_descargar_las_llaves(): void
    {
        Http::fake([
            self::CERT_URL => Http::response('error', 500),
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('No se pudieron descargar las llaves publicas de Firebase.');

        app(FirebaseTokenVerifier::class)->verify($this->firmar($this->claimsBase()));
    }

    private function claimsBase(): array
    {
        return [
            'iss' => 'https://securetoken.google.com/'.self::PROJECT_ID,
            'aud' => self::PROJECT_ID,
            'sub' => 'firebase-uid-default',
            'iat' => time() - 10,
            'exp' => time() + 3600,
            'auth_time' => time() - 5,
        ];
    }

    private function firmar(array $payload, array $header = []): string
    {
        return JWT::encode($payload, $this->llavePrivada, 'RS256', self::KID, $header);
    }

    private function fingirCertificados(): void
    {
        Http::fake([
            self::CERT_URL => Http::response([self::KID => $this->certificadoPem], 200, [
                'Cache-Control' => 'public, max-age=3600',
            ]),
        ]);
    }
}