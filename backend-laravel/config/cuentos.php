<?php

return [
    'activos_disk' => env('CUENTOS_ACTIVOS_DISK', 'supabase_private'),
    'activos_max_kb' => (int) env('CUENTOS_ACTIVOS_MAX_KB', 5120),
    'activos_max_dimension' => (int) env('CUENTOS_ACTIVOS_MAX_DIMENSION', 4096),
    'activos_url_ttl_minutos' => (int) env('CUENTOS_ACTIVOS_URL_TTL_MINUTOS', 5),
];
