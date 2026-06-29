<?php

namespace App\Services\Auth;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class FirebasePasswordResetLinkService
{
    public function __construct(private readonly GoogleServiceAccountTokenService $google) {}

    public function crear(string $email): string
    {
        $projectId = trim((string) config('services.firebase.project_id', ''));

        if ($projectId === '') {
            throw new RuntimeException('FIREBASE_PROJECT_ID no esta configurado.');
        }

        $payload = [
            'requestType' => 'PASSWORD_RESET',
            'email' => $email,
            'returnOobLink' => true,
            'continueUrl' => $this->urlResetFrontend(),
            'canHandleCodeInApp' => false,
        ];

        $linkDomain = trim((string) config('services.firebase.auth_link_domain', ''));
        if ($linkDomain !== '') {
            $payload['linkDomain'] = $linkDomain;
        }

        $respuesta = Http::withToken($this->google->token())
            ->post("https://identitytoolkit.googleapis.com/v1/projects/{$projectId}/accounts:sendOobCode", $payload);

        if (! $respuesta->successful()) {
            throw new RuntimeException('Firebase no pudo generar el enlace de recuperacion.');
        }

        $link = $respuesta->json('oobLink');
        $codigo = is_string($link) ? $this->extraerOobCode($link) : null;

        if (! $codigo) {
            throw new RuntimeException('Firebase no devolvio un codigo de recuperacion valido.');
        }

        return $this->linkFrontend($codigo);
    }

    private function urlResetFrontend(): string
    {
        $url = trim((string) config('services.firebase.password_reset_url', ''));

        if ($url !== '') {
            return $url;
        }

        return rtrim((string) env('FRONTEND_PRODUCTION_URL', env('FRONTEND_URL', '')), '/').'/restablecer-clave';
    }

    private function extraerOobCode(string $link): ?string
    {
        $query = parse_url($link, PHP_URL_QUERY);

        if (! is_string($query)) {
            return null;
        }

        parse_str($query, $params);
        $codigo = $params['oobCode'] ?? null;

        return is_string($codigo) && $codigo !== '' ? $codigo : null;
    }

    private function linkFrontend(string $oobCode): string
    {
        $base = $this->urlResetFrontend();
        $separador = Str::contains($base, '?') ? '&' : '?';

        return $base.$separador.http_build_query([
            'mode' => 'resetPassword',
            'oobCode' => $oobCode,
        ]);
    }
}
