<?php

namespace App\Services\Auth;

use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class GoogleServiceAccountTokenService
{
    private const SCOPE = 'https://www.googleapis.com/auth/identitytoolkit';

    public function token(): string
    {
        $cuenta = $this->serviceAccount();
        $cacheKey = 'google_service_account_token:'.sha1((string) $cuenta['client_email']);

        return Cache::remember($cacheKey, now()->addMinutes(50), fn () => $this->solicitarToken($cuenta));
    }

    public function configurado(): bool
    {
        return $this->rawServiceAccount() !== null;
    }

    /**
     * @return array{client_email: string, private_key: string, token_uri?: string}
     */
    private function serviceAccount(): array
    {
        $json = $this->rawServiceAccount();

        if ($json === null) {
            throw new RuntimeException('No se configuro una cuenta de servicio de Firebase.');
        }

        $cuenta = json_decode($json, true);

        if (! is_array($cuenta) || empty($cuenta['client_email']) || empty($cuenta['private_key'])) {
            throw new RuntimeException('La cuenta de servicio de Firebase no tiene el formato esperado.');
        }

        return $cuenta;
    }

    private function rawServiceAccount(): ?string
    {
        $base64 = trim((string) config('services.firebase.service_account_base64', ''));
        if ($base64 !== '') {
            $decoded = base64_decode($base64, true);

            return is_string($decoded) && $decoded !== '' ? $decoded : null;
        }

        $json = trim((string) config('services.firebase.service_account_json', ''));
        if ($json !== '') {
            return $json;
        }

        $path = trim((string) config('services.firebase.service_account_path', ''));
        if ($path === '') {
            return null;
        }

        $resolved = str_starts_with($path, DIRECTORY_SEPARATOR) || preg_match('/^[A-Za-z]:[\\\\\\/]/', $path)
            ? $path
            : base_path($path);

        return is_file($resolved) ? file_get_contents($resolved) ?: null : null;
    }

    /**
     * @param  array{client_email: string, private_key: string, token_uri?: string}  $cuenta
     */
    private function solicitarToken(array $cuenta): string
    {
        $ahora = time();
        $tokenUri = $cuenta['token_uri'] ?? 'https://oauth2.googleapis.com/token';
        $jwt = JWT::encode([
            'iss' => $cuenta['client_email'],
            'scope' => self::SCOPE,
            'aud' => $tokenUri,
            'iat' => $ahora,
            'exp' => $ahora + 3600,
        ], $cuenta['private_key'], 'RS256');

        $respuesta = Http::asForm()->post($tokenUri, [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt,
        ]);

        if (! $respuesta->successful()) {
            throw new RuntimeException('Google no emitio un token de servicio valido.');
        }

        $accessToken = $respuesta->json('access_token');

        if (! is_string($accessToken) || $accessToken === '') {
            throw new RuntimeException('La respuesta de Google no incluyo access_token.');
        }

        return $accessToken;
    }
}
