<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ClienteOneRoster;
use App\Models\RegistroLti;
use App\Models\VinculoLti;
use App\Services\Interoperabilidad\OneRosterAuthService;
use App\Services\Seguridad\RemoteUrlGuard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class InteroperabilidadAdminController extends Controller
{
    public function __construct(
        private readonly OneRosterAuthService $auth,
        private readonly RemoteUrlGuard $remoteUrls,
    ) {}

    public function index()
    {
        return [
            'oneroster' => ClienteOneRoster::with('institucion')->orderBy('nombre')->get(),
            'lti' => RegistroLti::orderBy('nombre')->get(),
            'estandar' => [
                'oneroster' => '1.2 Core Rostering (REST, lectura)',
                'lti' => 'LTI 1.3 / Advantage, registro seguro pendiente de credenciales del socio',
            ],
        ];
    }

    public function crearClienteOneRoster(Request $request)
    {
        $datos = $request->validate([
            'id_institucion' => ['required', 'integer', 'exists:instituciones,id'],
            'nombre' => ['required', 'string', 'max:120'],
            'scopes' => ['sometimes', 'array', 'max:10'],
            'scopes.*' => ['string', Rule::in([OneRosterAuthService::SCOPE_ROSTER_READONLY])],
        ]);

        return response()->json($this->auth->crearCliente($datos['id_institucion'], $datos['nombre'], $datos['scopes'] ?? []), 201);
    }

    public function revocarClienteOneRoster(ClienteOneRoster $cliente)
    {
        $cliente->update(['activo' => false]);
        $cliente->tokens()->update(['revocado_at' => now()]);

        return response()->noContent();
    }

    public function crearRegistroLti(Request $request)
    {
        $datos = $request->validate([
            'id_institucion' => ['required', 'integer', 'exists:instituciones,id'],
            'nombre' => ['required', 'string', 'max:120'],
            'rol_daemon' => ['required', Rule::in(['platform', 'tool'])],
            'issuer' => ['required', 'url:https', 'max:500'],
            'client_id' => ['required', 'string', 'max:180'],
            'deployment_id' => ['required', 'string', 'max:180'],
            'auth_login_url' => ['nullable', 'url:https', 'max:2000'],
            'auth_token_url' => ['nullable', 'url:https', 'max:2000'],
            'keyset_url' => ['nullable', 'url:https', 'max:2000'],
            'redirect_uris' => ['nullable', 'array', 'max:20'],
            'redirect_uris.*' => ['url:https', 'max:2000'],
            'servicios' => ['nullable', 'array'],
        ]);
        $registro = RegistroLti::create([...$datos, 'uuid' => (string) Str::uuid(), 'activo' => false]);

        return response()->json($registro, 201);
    }

    public function verificarRegistroLti(RegistroLti $registro)
    {
        abort_unless($registro->rol_daemon === 'tool' && $registro->auth_login_url && $registro->keyset_url, 422, 'El registro de herramienta requiere login OIDC y JWKS.');
        $this->remoteUrls->assertPublicHttps($registro->keyset_url);
        $jwks = Http::acceptJson()->withOptions(['allow_redirects' => false])->timeout(8)->retry(2, 200)->get($registro->keyset_url)->throw()->json();
        abort_unless(is_array($jwks['keys'] ?? null) && count($jwks['keys']) > 0, 422, 'El JWKS remoto no contiene claves.');
        $registro->update(['verificado_at' => now(), 'activo' => true]);

        return $registro->fresh();
    }

    public function vincularUsuarioLti(Request $request, RegistroLti $registro)
    {
        $datos = $request->validate([
            'id_usuario' => ['required', 'integer', 'exists:usuarios,id'],
            'subject' => ['required', 'string', 'max:255'],
        ]);
        $vinculo = VinculoLti::updateOrCreate(
            ['id_registro_lti' => $registro->id, 'subject' => $datos['subject']],
            ['id_usuario' => $datos['id_usuario'], 'activo' => true],
        );

        return response()->json($vinculo, 201);
    }
}
