<?php

namespace App\Http\Controllers\Interoperabilidad;

use App\Http\Controllers\Controller;
use App\Services\Interoperabilidad\OneRosterAuthService;
use Illuminate\Http\Request;

class OneRosterTokenController extends Controller
{
    public function __construct(private readonly OneRosterAuthService $auth) {}

    public function __invoke(Request $request)
    {
        abort_unless($request->input('grant_type') === 'client_credentials', 400, 'grant_type debe ser client_credentials.');
        [$basicId, $basicSecret] = $this->basicCredentials($request);
        $clientId = $basicId ?: (string) $request->input('client_id');
        $clientSecret = $basicSecret ?: (string) $request->input('client_secret');
        $resultado = $this->auth->emitir($clientId, $clientSecret, $request->input('scope'));

        if (! $resultado) {
            return response()->json(['error' => 'invalid_client'], 401, ['WWW-Authenticate' => 'Basic']);
        }
        if (isset($resultado['error'])) {
            return response()->json($resultado, 400);
        }

        return response()->json($resultado)->header('Cache-Control', 'no-store')->header('Pragma', 'no-cache');
    }

    private function basicCredentials(Request $request): array
    {
        $authorization = (string) $request->header('Authorization');
        if (! str_starts_with($authorization, 'Basic ')) {
            return [null, null];
        }
        $decoded = base64_decode(substr($authorization, 6), true);
        if (! is_string($decoded) || ! str_contains($decoded, ':')) {
            return [null, null];
        }

        return array_map('urldecode', explode(':', $decoded, 2));
    }
}
