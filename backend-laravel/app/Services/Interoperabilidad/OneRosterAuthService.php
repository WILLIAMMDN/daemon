<?php

namespace App\Services\Interoperabilidad;

use App\Models\ClienteOneRoster;
use App\Models\TokenOneRoster;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class OneRosterAuthService
{
    public const SCOPE_ROSTER_READONLY = 'https://purl.imsglobal.org/spec/or/v1p2/scope/roster-core.readonly';

    public const SCOPE_GRADEBOOK_READONLY = 'https://purl.imsglobal.org/spec/or/v1p2/scope/gradebook.readonly';

    public const SCOPE_GRADEBOOK_CORE_READONLY = 'https://purl.imsglobal.org/spec/or/v1p2/scope/gradebook-core.readonly';

    public function crearCliente(int $institucionId, string $nombre, array $scopes = []): array
    {
        $clientId = 'daemon_or_'.Str::lower(Str::random(24));
        $clientSecret = Str::random(64);
        $scopes = $scopes ?: [self::SCOPE_ROSTER_READONLY];
        if (array_intersect($scopes, [self::SCOPE_GRADEBOOK_READONLY, self::SCOPE_GRADEBOOK_CORE_READONLY])) {
            $scopes = [...$scopes, self::SCOPE_GRADEBOOK_READONLY, self::SCOPE_GRADEBOOK_CORE_READONLY];
        }
        $cliente = ClienteOneRoster::create([
            'id_institucion' => $institucionId,
            'nombre' => $nombre,
            'client_id' => $clientId,
            'secret_hash' => Hash::make($clientSecret),
            'scopes' => array_values(array_unique($scopes)),
        ]);

        return ['cliente' => $cliente, 'client_secret' => $clientSecret];
    }

    public function emitir(string $clientId, string $clientSecret, ?string $scopeSolicitado): ?array
    {
        $cliente = ClienteOneRoster::where('client_id', $clientId)->where('activo', true)->first();
        if (! $cliente || ! Hash::check($clientSecret, $cliente->secret_hash)) {
            return null;
        }

        $permitidos = $cliente->scopes ?? [];
        $solicitados = $scopeSolicitado ? preg_split('/\s+/', trim($scopeSolicitado)) : $permitidos;
        $solicitados = array_values(array_filter($solicitados ?: []));
        if (array_diff($solicitados, $permitidos)) {
            return ['error' => 'invalid_scope'];
        }

        TokenOneRoster::where('expira_at', '<=', now())->delete();
        $plainToken = Str::random(80);
        TokenOneRoster::create([
            'id_cliente' => $cliente->id,
            'token_hash' => hash('sha256', $plainToken),
            'scopes' => $solicitados,
            'expira_at' => now()->addHour(),
        ]);

        return [
            'access_token' => $plainToken,
            'token_type' => 'Bearer',
            'expires_in' => 3600,
            'scope' => implode(' ', $solicitados),
        ];
    }
}
