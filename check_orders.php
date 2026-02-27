<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Check latest orders for customer 1
$orders = App\Models\Order::where('customer_id', 1)
    ->latest()
    ->take(4)
    ->get(['order_number', 'is_credit', 'payment_method', 'payment_status', 'total', 'amount_paid', 'balance_due']);

foreach ($orders as $o) {
    echo "Order: " . $o->order_number . "\n";
    echo "  is_credit: " . ($o->is_credit ? 'true' : 'false') . "\n";
    echo "  payment_method: " . $o->payment_method . "\n";
    echo "  payment_status: " . $o->payment_status . "\n";
    echo "  total: " . $o->total . "\n";
    echo "  amount_paid: " . $o->amount_paid . "\n";
    echo "  balance_due: " . $o->balance_due . "\n";
    echo "\n";
}
