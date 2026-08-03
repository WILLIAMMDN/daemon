<?php

return [
    'environment_name' => env(
        'DAEMON_ENVIRONMENT',
        filter_var(env('RENDER', false), FILTER_VALIDATE_BOOL) ? env('APP_ENV') : null,
    ),
    'render_runtime' => filter_var(env('RENDER', false), FILTER_VALIDATE_BOOL),
    'frontend_url' => env('FRONTEND_URL'),
    'uploads_disk' => env('UPLOADS_DISK', 'public'),
    'pusher_key' => env('PUSHER_APP_KEY'),
    // Autorizacion exacta y temporal, por ejemplo: daemon:aplicar-retencion.
    'allow_production_destructive' => env('DAEMON_ALLOW_PRODUCTION_DESTRUCTIVE'),
];
