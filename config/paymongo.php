<?php

return [
    /*
    |--------------------------------------------------------------------------
    | PayMongo API Keys
    |--------------------------------------------------------------------------
    */
    'secret_key' => env('PAYMONGO_SECRET_KEY'),
    'public_key' => env('PAYMONGO_PUBLIC_KEY'),

    /*
    |--------------------------------------------------------------------------
    | Webhook Secret
    |--------------------------------------------------------------------------
    */
    'webhook_secret' => env('PAYMONGO_WEBHOOK_SECRET'),

    /*
    |--------------------------------------------------------------------------
    | Live Mode
    |--------------------------------------------------------------------------
    */
    'livemode' => env('PAYMONGO_LIVEMODE', false),

    /*
    |--------------------------------------------------------------------------
    | API Version
    |--------------------------------------------------------------------------
    */
    'api_version' => '2019-08-01',

    /*
    |--------------------------------------------------------------------------
    | Default Currency
    |--------------------------------------------------------------------------
    */
    'currency' => 'PHP',

    /*
    |--------------------------------------------------------------------------
    | Payment Methods
    |--------------------------------------------------------------------------
    */
    'payment_methods' => [
        'card' => [
            'enabled' => true,
            'fee_percentage' => 3.5,
            'fee_fixed' => 15, // in PHP centavos
        ],
        'gcash' => [
            'enabled' => true,
            'fee_percentage' => 2.5,
            'fee_fixed' => 0,
        ],
        'grab_pay' => [
            'enabled' => true,
            'fee_percentage' => 2.5,
            'fee_fixed' => 0,
        ],
        'paymaya' => [
            'enabled' => true,
            'fee_percentage' => 2.5,
            'fee_fixed' => 0,
        ],
        'dob' => [ // Direct Online Banking
            'enabled' => true,
            'fee_percentage' => 1.5,
            'fee_fixed' => 0,
            'banks' => ['bpi', 'unionbank'],
        ],
        'billease' => [
            'enabled' => true,
            'fee_percentage' => 3.0,
            'fee_fixed' => 0,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Checkout Configuration
    |--------------------------------------------------------------------------
    */
    'checkout' => [
        'success_url' => '/payment/success',
        'cancel_url' => '/payment/cancel',
        'statement_descriptor' => 'PadayON',
    ],

    /*
    |--------------------------------------------------------------------------
    | Platform/Marketplace Features
    |--------------------------------------------------------------------------
    */
    'platform' => [
        'enabled' => true,
        'sub_account_fee' => 75, // PHP per month per sub-account
        'platform_fee_percentage' => 0.5, // Additional platform fee on transactions
    ],
];
