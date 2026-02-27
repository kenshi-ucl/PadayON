<?php

return [
    /*
    |--------------------------------------------------------------------------
    | PadayON Platform Configuration
    |--------------------------------------------------------------------------
    */

    'name' => 'PadayON',
    'tagline' => 'Kasama mo sa tagumpay',
    'description' => 'The all-in-one platform for Filipino small businesses',

    /*
    |--------------------------------------------------------------------------
    | Default Business Features
    |--------------------------------------------------------------------------
    | All businesses get these core features regardless of type.
    */
    'default_features' => ['pos', 'inventory', 'customers', 'orders', 'reports'],

    /*
    |--------------------------------------------------------------------------
    | Default Product Categories
    |--------------------------------------------------------------------------
    */
    'default_categories' => [
        'general' => 'General',
        'food_beverage' => 'Food & Beverage',
        'merchandise' => 'Merchandise',
        'services' => 'Services',
        'supplies' => 'Supplies',
        'accessories' => 'Accessories',
        'others' => 'Others',
    ],

    /*
    |--------------------------------------------------------------------------
    | Credit/Utang Settings
    |--------------------------------------------------------------------------
    */
    'credit' => [
        'default_limit' => 500,
        'reminder_days' => [7, 14, 30],
        'interest_rate' => 0,
    ],

    /*
    |--------------------------------------------------------------------------
    | Subscription Plans
    |--------------------------------------------------------------------------
    */
    'plans' => [
        'free' => [
            'name' => 'Libre',
            'price' => 0,
            'price_formatted' => '₱0',
            'billing_period' => 'forever',
            'features' => [
                'pos' => true,
                'inventory_limit' => 100,
                'credit_tracking' => true,
                'sms_limit' => 50,
                'staff_limit' => 1,
                'reports' => 'basic',
                'website' => false,
                'custom_domain' => false,
                'api_access' => false,
                'priority_support' => false,
            ],
        ],
        'starter' => [
            'name' => 'Starter',
            'price' => 500,
            'price_formatted' => '₱500',
            'billing_period' => 'monthly',
            'features' => [
                'pos' => true,
                'inventory_limit' => 500,
                'credit_tracking' => true,
                'sms_limit' => 500,
                'staff_limit' => 3,
                'reports' => 'standard',
                'website' => true,
                'custom_domain' => false,
                'api_access' => false,
                'priority_support' => false,
            ],
        ],
        'pro' => [
            'name' => 'Pro',
            'price' => 1500,
            'price_formatted' => '₱1,500',
            'billing_period' => 'monthly',
            'features' => [
                'pos' => true,
                'inventory_limit' => 2000,
                'credit_tracking' => true,
                'sms_limit' => 2000,
                'staff_limit' => 10,
                'reports' => 'advanced',
                'website' => true,
                'custom_domain' => true,
                'api_access' => true,
                'priority_support' => true,
            ],
        ],
        'business' => [
            'name' => 'Business',
            'price' => 2500,
            'price_formatted' => '₱2,500',
            'billing_period' => 'monthly',
            'features' => [
                'pos' => true,
                'inventory_limit' => null,
                'credit_tracking' => true,
                'sms_limit' => null,
                'staff_limit' => null,
                'reports' => 'advanced',
                'website' => true,
                'custom_domain' => true,
                'api_access' => true,
                'priority_support' => true,
                'multi_branch' => true,
                'white_label' => true,
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Currency Settings
    |--------------------------------------------------------------------------
    */
    'currency' => [
        'code' => 'PHP',
        'symbol' => '₱',
        'decimal_separator' => '.',
        'thousands_separator' => ',',
        'decimal_places' => 2,
    ],

    /*
    |--------------------------------------------------------------------------
    | Tax Settings (Philippines)
    |--------------------------------------------------------------------------
    */
    'tax' => [
        'vat_rate' => 0, // TEMPORARILY set to 0 (was 12) — change back to 12 to re-enable VAT
        'vat_threshold' => 3000000,
        'withholding_tax_rate' => 1,
    ],

    /*
    |--------------------------------------------------------------------------
    | Delivery Settings
    |--------------------------------------------------------------------------
    */
    'delivery' => [
        'default_radius_km' => 10,
        'base_fee' => 50,
        'per_km_fee' => 10,
        'free_delivery_minimum' => 500,
        'time_slots' => [
            '08:00-10:00' => '8:00 AM - 10:00 AM',
            '10:00-12:00' => '10:00 AM - 12:00 PM',
            '12:00-14:00' => '12:00 PM - 2:00 PM',
            '14:00-16:00' => '2:00 PM - 4:00 PM',
            '16:00-18:00' => '4:00 PM - 6:00 PM',
            '18:00-20:00' => '6:00 PM - 8:00 PM',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Website Builder Settings
    |--------------------------------------------------------------------------
    */
    'website' => [
        'templates' => [
            'modern' => 'Modern',
            'minimal' => 'Minimal',
            'vibrant' => 'Vibrant Filipino',
            'classic' => 'Classic',
            'elegant' => 'Elegant',
        ],
        'subdomain_suffix' => '.padayon.ph',
    ],

    /*
    |--------------------------------------------------------------------------
    | Regions (Philippines)
    |--------------------------------------------------------------------------
    */
    'regions' => [
        'NCR' => 'National Capital Region',
        'CAR' => 'Cordillera Administrative Region',
        'I' => 'Ilocos Region',
        'II' => 'Cagayan Valley',
        'III' => 'Central Luzon',
        'IV-A' => 'CALABARZON',
        'IV-B' => 'MIMAROPA',
        'V' => 'Bicol Region',
        'VI' => 'Western Visayas',
        'VII' => 'Central Visayas',
        'VIII' => 'Eastern Visayas',
        'IX' => 'Zamboanga Peninsula',
        'X' => 'Northern Mindanao',
        'XI' => 'Davao Region',
        'XII' => 'SOCCSKSARGEN',
        'XIII' => 'Caraga',
        'BARMM' => 'Bangsamoro',
    ],
];
