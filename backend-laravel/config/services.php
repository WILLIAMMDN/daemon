<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT'),
    ],

    'firebase' => [
        'project_id' => env('FIREBASE_PROJECT_ID'),
        'certificates_url' => env('FIREBASE_CERTIFICATES_URL', 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'),
        'service_account_path' => env('FIREBASE_SERVICE_ACCOUNT_PATH'),
        'service_account_json' => env('FIREBASE_SERVICE_ACCOUNT_JSON'),
        'service_account_base64' => env('FIREBASE_SERVICE_ACCOUNT_BASE64'),
        'password_reset_url' => env('FIREBASE_PASSWORD_RESET_URL', rtrim((string) env('FRONTEND_PRODUCTION_URL', env('FRONTEND_URL', '')), '/').'/restablecer-clave'),
        'auth_link_domain' => env('FIREBASE_AUTH_LINK_DOMAIN'),
    ],

];
