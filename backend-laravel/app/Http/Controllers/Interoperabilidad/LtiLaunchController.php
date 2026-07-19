<?php

namespace App\Http\Controllers\Interoperabilidad;

use App\Http\Controllers\Controller;
use App\Models\RegistroLti;
use App\Models\VinculoLti;
use App\Services\Auth\AutenticacionService;
use App\Services\Seguridad\RemoteUrlGuard;
use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Cookie;
use Throwable;

class LtiLaunchController extends Controller
{
    private const CLAIM_DEPLOYMENT = 'https://purl.imsglobal.org/spec/lti/claim/deployment_id';

    private const CLAIM_VERSION = 'https://purl.imsglobal.org/spec/lti/claim/version';

    private const CLAIM_MESSAGE_TYPE = 'https://purl.imsglobal.org/spec/lti/claim/message_type';

    public function __construct(
        private readonly AutenticacionService $autenticacion,
        private readonly RemoteUrlGuard $remoteUrls,
    ) {}

    public function login(Request $request)
    {
        $datos = $request->validate([
            'iss' => ['required', 'string', 'max:500'],
            'login_hint' => ['required', 'string', 'max:2000'],
            'client_id' => ['nullable', 'string', 'max:180'],
            'lti_message_hint' => ['nullable', 'string', 'max:4000'],
            'target_link_uri' => ['nullable', 'url:https', 'max:2000'],
        ]);
        $registro = RegistroLti::query()
            ->where('rol_daemon', 'tool')
            ->where('issuer', $datos['iss'])
            ->where('activo', true)
            ->when($datos['client_id'] ?? null, fn ($query, $clientId) => $query->where('client_id', $clientId))
            ->firstOrFail();
        abort_unless($registro->auth_login_url && $registro->keyset_url, 422, 'El registro LTI no está completo.');

        $state = Str::random(64);
        $nonce = Str::random(64);
        Cache::put("lti:state:{$state}", ['registro_id' => $registro->id, 'nonce' => $nonce], now()->addMinutes(10));
        $parametros = array_filter([
            'scope' => 'openid',
            'response_type' => 'id_token',
            'response_mode' => 'form_post',
            'prompt' => 'none',
            'client_id' => $registro->client_id,
            'redirect_uri' => url('/lti/launch'),
            'login_hint' => $datos['login_hint'],
            'lti_message_hint' => $datos['lti_message_hint'] ?? null,
            'state' => $state,
            'nonce' => $nonce,
        ]);

        return redirect()->away($registro->auth_login_url.'?'.http_build_query($parametros, '', '&', PHP_QUERY_RFC3986));
    }

    public function launch(Request $request)
    {
        $datos = $request->validate(['state' => ['required', 'string'], 'id_token' => ['required', 'string']]);
        $estado = Cache::pull("lti:state:{$datos['state']}");
        abort_unless(is_array($estado), 401, 'El state LTI venció o ya fue utilizado.');
        $registro = RegistroLti::whereKey($estado['registro_id'])->where('activo', true)->firstOrFail();
        $this->remoteUrls->assertPublicHttps($registro->keyset_url);
        $jwks = Cache::remember("lti:jwks:{$registro->id}", now()->addMinutes(5), function () use ($registro): array {
            $respuesta = Http::acceptJson()->withOptions(['allow_redirects' => false])->timeout(8)->retry(2, 200)->get($registro->keyset_url)->throw();

            return $respuesta->json();
        });

        JWT::$leeway = 60;
        try {
            $claims = (array) JWT::decode($datos['id_token'], JWK::parseKeySet($jwks, 'RS256'));
        } catch (Throwable) {
            abort(401, 'La firma o vigencia del lanzamiento LTI es inválida.');
        }
        $audiencias = is_array($claims['aud'] ?? null) ? $claims['aud'] : [$claims['aud'] ?? null];
        abort_unless(hash_equals($registro->issuer, (string) ($claims['iss'] ?? '')), 401, 'Issuer LTI inválido.');
        abort_unless(in_array($registro->client_id, $audiencias, true), 401, 'Audience LTI inválida.');
        if (count($audiencias) > 1) {
            abort_unless(hash_equals($registro->client_id, (string) ($claims['azp'] ?? '')), 401, 'Authorized party LTI inválida.');
        }
        abort_unless(hash_equals((string) $estado['nonce'], (string) ($claims['nonce'] ?? '')), 401, 'Nonce LTI inválido.');
        abort_unless((int) ($claims['iat'] ?? 0) <= now()->timestamp + 60, 401, 'Fecha de emisión LTI inválida.');
        abort_unless(hash_equals($registro->deployment_id, (string) ($claims[self::CLAIM_DEPLOYMENT] ?? '')), 401, 'Deployment LTI inválido.');
        abort_unless(($claims[self::CLAIM_VERSION] ?? null) === '1.3.0', 401, 'Versión LTI no compatible.');
        abort_unless(in_array($claims[self::CLAIM_MESSAGE_TYPE] ?? null, ['LtiResourceLinkRequest', 'LtiDeepLinkingRequest'], true), 401, 'Tipo de mensaje LTI no permitido.');

        $vinculo = VinculoLti::with('usuario')
            ->where('id_registro_lti', $registro->id)
            ->where('subject', (string) ($claims['sub'] ?? ''))
            ->where('activo', true)
            ->first();
        abort_unless($vinculo?->usuario, 403, 'El usuario LTI aún no fue vinculado por un administrador.');
        $vinculo->update(['ultimo_acceso_at' => now()]);

        $token = $this->autenticacion->emitirToken($vinculo->usuario, "lti:{$registro->id}");
        $destino = match ($vinculo->usuario->rol) {
            'alumno' => '/alumno', 'docente', 'admin' => '/docente', 'tutor' => '/familias', default => '/',
        };

        $frontend = rtrim((string) config('daemon.asset_public_url'), '/');
        abort_if($frontend === '', 503, 'El frontend de DAEMON no está configurado.');

        return redirect()->away($frontend.$destino)
            ->withCookie($this->authCookie($token));
    }

    private function authCookie(string $token): Cookie
    {
        return cookie(
            (string) config('daemon.auth_cookie.name', 'daemon_access'),
            rtrim(strtr(base64_encode($token), '+/', '-_'), '='),
            (int) config('daemon.auth_cookie.minutes', 480),
            '/',
            null,
            (bool) config('daemon.auth_cookie.secure', false),
            true,
            false,
            (string) config('daemon.auth_cookie.same_site', 'lax'),
        );
    }
}
