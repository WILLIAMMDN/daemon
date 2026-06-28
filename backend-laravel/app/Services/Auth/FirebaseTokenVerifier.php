<?php

namespace App\Services\Auth;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use UnexpectedValueException;

class FirebaseTokenVerifier
{
    private const CERTIFICATES_CACHE_KEY = 'firebase.id_token_certificates';

    public function verify(string $idToken): array
    {
        $projectId = trim((string) config('services.firebase.project_id', ''));

        if ($projectId === '') {
            throw new RuntimeException('Firebase no esta configurado en el backend.');
        }

        $header = $this->decodeSegment(explode('.', $idToken)[0] ?? '');
        $kid = $header['kid'] ?? null;

        if (($header['alg'] ?? null) !== 'RS256' || ! is_string($kid) || $kid === '') {
            throw new UnexpectedValueException('El token de Firebase no tiene una firma valida.');
        }

        $certificates = $this->certificates();
        $certificate = $certificates[$kid] ?? null;

        if (! is_string($certificate) || $certificate === '') {
            Cache::forget(self::CERTIFICATES_CACHE_KEY);
            throw new UnexpectedValueException('No se encontro la llave publica de Firebase.');
        }

        $payload = $this->toArray(JWT::decode($idToken, new Key($certificate, 'RS256')));
        $issuer = "https://securetoken.google.com/{$projectId}";

        if (($payload['aud'] ?? null) !== $projectId || ($payload['iss'] ?? null) !== $issuer) {
            throw new UnexpectedValueException('El token de Firebase no pertenece a este proyecto.');
        }

        if (! isset($payload['sub']) || ! is_string($payload['sub']) || $payload['sub'] === '' || strlen($payload['sub']) > 128) {
            throw new UnexpectedValueException('El token de Firebase no contiene un usuario valido.');
        }

        if (isset($payload['auth_time']) && (int) $payload['auth_time'] > time()) {
            throw new UnexpectedValueException('La sesion de Firebase todavia no es valida.');
        }

        return [
            'uid' => $payload['sub'],
            'email' => $this->stringOrNull($payload['email'] ?? null),
            'email_verified' => (bool) ($payload['email_verified'] ?? false),
            'name' => $this->stringOrNull($payload['name'] ?? null),
            'picture' => $this->stringOrNull($payload['picture'] ?? null),
            'phone_number' => $this->stringOrNull($payload['phone_number'] ?? null),
            'provider' => $this->stringOrNull($payload['firebase']['sign_in_provider'] ?? null),
            'google_id' => $this->providerIdentity($payload, 'google.com'),
            'raw' => $payload,
        ];
    }

    private function certificates(): array
    {
        $cached = Cache::get(self::CERTIFICATES_CACHE_KEY);

        if (is_array($cached) && $cached !== []) {
            return $cached;
        }

        $url = (string) config('services.firebase.certificates_url');
        $response = Http::timeout(10)->get($url);

        if (! $response->ok()) {
            throw new RuntimeException('No se pudieron descargar las llaves publicas de Firebase.');
        }

        $certificates = $response->json();

        if (! is_array($certificates) || $certificates === []) {
            throw new RuntimeException('Firebase devolvio llaves publicas invalidas.');
        }

        $maxAge = 3600;
        $cacheControl = $response->header('Cache-Control', '');

        if (preg_match('/max-age=(\d+)/', $cacheControl, $matches) === 1) {
            $maxAge = max(60, (int) $matches[1] - 60);
        }

        Cache::put(self::CERTIFICATES_CACHE_KEY, $certificates, now()->addSeconds($maxAge));

        return $certificates;
    }

    private function decodeSegment(string $segment): array
    {
        if ($segment === '') {
            throw new UnexpectedValueException('El token de Firebase esta incompleto.');
        }

        $padding = (4 - strlen($segment) % 4) % 4;
        $decoded = base64_decode(strtr($segment, '-_', '+/').str_repeat('=', $padding), true);

        if ($decoded === false) {
            throw new UnexpectedValueException('No se pudo leer el token de Firebase.');
        }

        $json = json_decode($decoded, true);

        if (! is_array($json)) {
            throw new UnexpectedValueException('El token de Firebase no tiene formato JSON valido.');
        }

        return $json;
    }

    private function providerIdentity(array $payload, string $provider): ?string
    {
        $identities = $payload['firebase']['identities'][$provider] ?? null;

        if (is_array($identities) && isset($identities[0]) && is_string($identities[0])) {
            return $identities[0];
        }

        return null;
    }

    private function stringOrNull(mixed $value): ?string
    {
        return is_string($value) && $value !== '' ? $value : null;
    }

    private function toArray(mixed $value): mixed
    {
        if (is_object($value)) {
            $value = get_object_vars($value);
        }

        if (is_array($value)) {
            return array_map(fn ($item) => $this->toArray($item), $value);
        }

        return $value;
    }
}
