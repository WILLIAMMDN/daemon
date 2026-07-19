<?php

namespace App\Services\Seguridad;

class RemoteUrlGuard
{
    public function assertPublicHttps(string $url): void
    {
        $partes = parse_url($url);
        abort_unless(
            is_array($partes)
            && strtolower((string) ($partes['scheme'] ?? '')) === 'https'
            && ! empty($partes['host'])
            && (! isset($partes['port']) || (int) $partes['port'] === 443),
            422,
            'La URL remota debe usar HTTPS público en el puerto 443.',
        );

        $host = strtolower((string) $partes['host']);
        abort_if($host === 'localhost' || str_ends_with($host, '.localhost'), 422, 'Host remoto no permitido.');
        $ips = filter_var($host, FILTER_VALIDATE_IP) ? [$host] : (gethostbynamel($host) ?: []);
        foreach (dns_get_record($host, DNS_AAAA) ?: [] as $registro) {
            if (! empty($registro['ipv6'])) {
                $ips[] = $registro['ipv6'];
            }
        }
        abort_if($ips === [], 422, 'El host remoto no se pudo resolver.');

        foreach (array_unique($ips) as $ip) {
            abort_unless(
                filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE),
                422,
                'El host remoto resuelve a una red privada o reservada.',
            );
        }
    }
}
