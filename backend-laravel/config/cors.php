<?php

// FRONTEND_URL puede ser UNA url o VARIAS separadas por coma.
// Esto deja agregar facilmente el dominio de Firebase Hosting de produccion.
$frontendUrls = array_filter(array_map(
    'trim',
    explode(',', (string) env('FRONTEND_URL', 'http://localhost:4200'))
));

// Desarrollo local. `ng serve` cambia de puerto cuando otro worktree ya ocupa
// el 4200, asi que la lista cubre los puertos que usa el equipo en vez de un
// unico valor. Son cadenas literales a proposito: EnsureCookieRequestIsFromAllowedOrigin
// compara contra esta misma lista para autorizar escrituras con cookie, y no
// entiende patrones.
$puertosLocales = [4200, 4260, 4300, 4400, 5173, 8000];
$origenesLocales = [];
foreach ($puertosLocales as $puerto) {
    $origenesLocales[] = 'http://localhost:'.$puerto;
    $origenesLocales[] = 'http://127.0.0.1:'.$puerto;
}

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'storage/*', 'broadcasting/*'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    'allowed_origins' => array_values(array_unique([
        ...$frontendUrls,
        // Produccion: Firebase Hosting del proyecto DAEMON estudiante
        'https://daemonestudiante.web.app',
        'https://daemon-a41f8.web.app',
        'https://daemon-a41f8.firebaseapp.com',
        // Desarrollo local
        ...$origenesLocales,
    ])),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Accept', 'Authorization', 'Content-Type', 'Origin', 'X-Requested-With', 'X-XSRF-TOKEN'],
    'exposed_headers' => [],
    'max_age' => 3600,
    'supports_credentials' => env('CORS_SUPPORTS_CREDENTIALS', true),
];
