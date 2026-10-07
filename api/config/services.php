<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    // DB-IP's free "IP to City Lite" database (CC BY 4.0), for the admin page's map. A file on
    // this server, refreshed monthly by `php artisan geo:update`; lookups never leave it.
    'dbip' => [
        'path' => env('GEO_DATABASE_PATH', storage_path('app/geo/dbip-city-lite.mmdb')),
        // %s is the month, e.g. 2026-10.
        'url' => 'https://download.db-ip.com/free/dbip-city-lite-%s.mmdb.gz',
    ],

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

];
