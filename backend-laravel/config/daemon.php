<?php

return [
    'asset_cloud_url' => env('ASSET_CLOUD_URL', env('SUPABASE_STORAGE_PUBLIC_URL', '')),
    'asset_public_url' => env(
        'ASSET_PUBLIC_URL',
        env('FRONTEND_PRODUCTION_URL', env('FRONTEND_URL', '')),
    ),
    'private_uploads_disk' => env('PRIVATE_UPLOADS_DISK', 'supabase_private'),
    'private_upload_url_minutes' => (int) env('PRIVATE_UPLOAD_URL_MINUTES', 10),
    'private_upload_prefixes' => ['uploads/entregas/'],
    'familias' => [
        'zona_horaria' => env('FAMILY_DEFAULT_TIMEZONE', 'America/Lima'),
        'portal_pagos_url' => env('FAMILY_PAYMENTS_PORTAL_URL'),
        'soporte_email' => env('FAMILY_SUPPORT_EMAIL', env('MAIL_FROM_ADDRESS')),
    ],
    'auth_cookie' => [
        'name' => env('AUTH_COOKIE_NAME', 'daemon_access'),
        'minutes' => (int) env('SANCTUM_TOKEN_EXPIRATION', 480),
        'same_site' => env('AUTH_COOKIE_SAME_SITE', env('APP_ENV') === 'production' ? 'none' : 'lax'),
        'secure' => env('AUTH_COOKIE_SECURE', env('APP_ENV') === 'production'),
        'expose_bearer_token' => env('AUTH_EXPOSE_BEARER_TOKEN', false),
    ],
];
