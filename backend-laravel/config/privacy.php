<?php

return [
    'policy_version' => env('PRIVACY_POLICY_VERSION', '2026-07-15'),

    'retention' => [
        'read_notifications_days' => (int) env('PRIVACY_READ_NOTIFICATIONS_DAYS', 180),
        'failed_jobs_hours' => (int) env('PRIVACY_FAILED_JOBS_HOURS', 168),
        'resolved_requests_days' => (int) env('PRIVACY_RESOLVED_REQUESTS_DAYS', 730),
    ],
];
