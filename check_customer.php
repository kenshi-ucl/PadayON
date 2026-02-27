<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Check all customers
$customers = App\Models\Customer::all();
foreach ($customers as $c) {
    echo "ID: " . $c->id . " - " . $c->name . "\n";
    echo "  credit_enabled: " . ($c->credit_enabled ? 'true' : 'false') . "\n";
    echo "  orders count: " . $c->orders()->count() . "\n";
    echo "\n";
}
