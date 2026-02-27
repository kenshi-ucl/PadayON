<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Pusher (Real-time)
    |--------------------------------------------------------------------------
    */
    'pusher' => [
        'app_id' => env('PUSHER_APP_ID'),
        'key' => env('PUSHER_APP_KEY'),
        'secret' => env('PUSHER_APP_SECRET'),
        'cluster' => env('PUSHER_APP_CLUSTER', 'ap1'),
    ],

    /*
    |--------------------------------------------------------------------------
    | SMS Services
    |--------------------------------------------------------------------------
    */
    'semaphore' => [
        'api_key' => env('SEMAPHORE_API_KEY'),
        'sender_name' => env('SEMAPHORE_SENDER_NAME', 'PadayON'),
        'base_url' => 'https://api.semaphore.co/api/v4',
        'cost_per_sms' => 0.50, // PHP
    ],

    'infobip' => [
        'api_key' => env('INFOBIP_API_KEY'),
        'base_url' => env('INFOBIP_BASE_URL', 'https://api.infobip.com'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Payment Gateways
    |--------------------------------------------------------------------------
    */
    'dragonpay' => [
        'merchant_id' => env('DRAGONPAY_MERCHANT_ID'),
        'password' => env('DRAGONPAY_PASSWORD'),
        'api_url' => env('DRAGONPAY_API_URL', 'https://test.dragonpay.ph/api/collect/v1'),
        'channels' => [
            'otc_711' => '7-Eleven',
            'otc_bayad' => 'Bayad Center',
            'otc_mlhuillier' => 'M Lhuillier',
            'otc_cebuana' => 'Cebuana Lhuillier',
            'otc_ecpay' => 'ECPay',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Courier Services
    |--------------------------------------------------------------------------
    */
    'lbc' => [
        'api_key' => env('LBC_API_KEY'),
        'api_secret' => env('LBC_API_SECRET'),
        'account_id' => env('LBC_ACCOUNT_ID'),
        'base_url' => 'https://api.lbcexpress.com',
        'cod_fee_percentage' => 3,
        'cod_fee_min' => 30,
    ],

    'jt_express' => [
        'api_key' => env('JT_API_KEY'),
        'customer_id' => env('JT_CUSTOMER_ID'),
        'base_url' => 'https://openapi.jtexpress.ph',
        'cod_fee_percentage' => 2.75,
    ],

    /*
    |--------------------------------------------------------------------------
    | E-Loading Provider
    |--------------------------------------------------------------------------
    */
    'eload' => [
        'provider' => env('ELOAD_PROVIDER', 'vmobile'),
        'api_key' => env('ELOAD_PROVIDER_API_KEY'),
        'endpoint' => env('ELOAD_PROVIDER_ENDPOINT'),
        'networks' => [
            'globe' => ['Globe', 'TM'],
            'smart' => ['Smart', 'TNT', 'Sun'],
            'dito' => ['DITO'],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Bills Payment Provider
    |--------------------------------------------------------------------------
    */
    'bills_payment' => [
        'provider' => env('BILLS_PAYMENT_PROVIDER', 'ecpay'),
        'api_key' => env('BILLS_PAYMENT_API_KEY'),
        'categories' => [
            'electric' => ['Meralco', 'VECO', 'Davao Light'],
            'water' => ['Manila Water', 'Maynilad', 'Metro Cebu Water'],
            'internet' => ['PLDT', 'Globe', 'Converge', 'Sky'],
            'insurance' => ['SSS', 'PhilHealth', 'Pag-IBIG'],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Google Maps (Delivery Routing)
    |--------------------------------------------------------------------------
    */
    'google_maps' => [
        'api_key' => env('GOOGLE_MAPS_API_KEY'),
        'default_location' => [
            'lat' => 14.5995,
            'lng' => 120.9842, // Manila
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | BIR E-Invoicing
    |--------------------------------------------------------------------------
    */
    'bir' => [
        'tin' => env('BIR_TIN'),
        'branch_code' => env('BIR_BRANCH_CODE', '000'),
        'eis_endpoint' => env('BIR_EIS_ENDPOINT'),
        'enabled' => env('BIR_EIS_ENABLED', false),
    ],

];
