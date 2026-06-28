<?php

// FRONTEND_URL puede ser UNA url o VARIAS separadas por coma.
// Esto deja agregar facilmente el dominio de Firebase Hosting de produccion.
$frontendUrls = array_filter(array_map(
    'trim',
    explode(',', (string) env('FRONTEND_URL', 'http://localhost:4200'))
));

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'storage/*'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    'allowed_origins' => array_values(array_unique([
        ...$frontendUrls,
        // Produccion: Firebase Hosting del proyecto DAEMON estudiante
        'https://daemonestudiante.web.app',
        'https://daemon-a41f8.web.app',
        'https://daemon-a41f8.firebaseapp.com',
        // Desarrollo local
        'http://localhost:4200',
        'http://127.0.0.1:4200',
        'http://localhost:4300',
        'http://127.0.0.1:4300',
        'http://localhost:8000',
    ])),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Accept', 'Authorization', 'Content-Type', 'Origin', 'X-Requested-With', 'X-XSRF-TOKEN'],
    'exposed_headers' => [],
    'max_age' => 3600,
    'supports_credentials' => env('CORS_SUPPORTS_CREDENTIALS', false),
];
