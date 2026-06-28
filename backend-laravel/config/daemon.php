<?php

return [
    'asset_cloud_url' => env('ASSET_CLOUD_URL', env('SUPABASE_STORAGE_PUBLIC_URL', '')),
    'asset_public_url' => env(
        'ASSET_PUBLIC_URL',
        env('FRONTEND_PRODUCTION_URL', env('FRONTEND_URL', '')),
    ),
];
