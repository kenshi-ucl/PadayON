<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailyReport extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'report_date',
        'total_orders',
        'gross_sales',
        'discounts',
        'taxes',
        'net_sales',
        'cash_collected',
        'gcash_collected',
        'maya_collected',
        'card_collected',
        'credit_sales',
        'credit_collected',
        'eload_transactions',
        'eload_sales',
        'eload_profit',
        'bills_transactions',
        'bills_amount',
        'items_sold',
        'cost_of_goods',
        'gross_profit',
        'new_customers',
        'returning_customers',
        'laundry_jobs',
        'laundry_weight',
        'catering_events',
        'catering_guests',
        'top_products',
        'metadata',
    ];

    protected $casts = [
        'report_date' => 'date',
        'gross_sales' => 'decimal:2',
        'discounts' => 'decimal:2',
        'taxes' => 'decimal:2',
        'net_sales' => 'decimal:2',
        'cash_collected' => 'decimal:2',
        'gcash_collected' => 'decimal:2',
        'maya_collected' => 'decimal:2',
        'card_collected' => 'decimal:2',
        'credit_sales' => 'decimal:2',
        'credit_collected' => 'decimal:2',
        'eload_sales' => 'decimal:2',
        'eload_profit' => 'decimal:2',
        'bills_amount' => 'decimal:2',
        'cost_of_goods' => 'decimal:2',
        'gross_profit' => 'decimal:2',
        'laundry_weight' => 'decimal:2',
        'top_products' => 'array',
        'metadata' => 'array',
    ];

    public static function generateForDate(string $tenantId, $date): self
    {
        $date = \Carbon\Carbon::parse($date);

        $orders = Order::where('tenant_id', $tenantId)
            ->whereDate('created_at', $date)
            ->get();

        $report = self::updateOrCreate(
            ['tenant_id' => $tenantId, 'report_date' => $date],
            [
                'total_orders' => $orders->count(),
                'gross_sales' => $orders->sum('subtotal'),
                'discounts' => $orders->sum('discount_amount'),
                'taxes' => $orders->sum('tax_amount'),
                'net_sales' => $orders->where('payment_status', 'paid')->sum('total'),
                'cash_collected' => $orders->where('payment_method', 'cash')->where('payment_status', 'paid')->sum('total'),
                'gcash_collected' => $orders->where('payment_method', 'gcash')->where('payment_status', 'paid')->sum('total'),
                'maya_collected' => $orders->where('payment_method', 'maya')->where('payment_status', 'paid')->sum('total'),
                'card_collected' => $orders->where('payment_method', 'card')->where('payment_status', 'paid')->sum('total'),
                'credit_sales' => $orders->where('is_credit', true)->sum('total'),
            ]
        );

        return $report;
    }
}
