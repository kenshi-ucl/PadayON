<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'subscription_id',
        'invoice_number',
        'subtotal',
        'tax',
        'total',
        'currency',
        'status',
        'due_date',
        'paid_at',
        'payment_method',
        'payment_reference',
        'line_items',
        'notes',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax' => 'decimal:2',
        'total' => 'decimal:2',
        'due_date' => 'date',
        'paid_at' => 'datetime',
        'line_items' => 'array',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function subscription()
    {
        return $this->belongsTo(Subscription::class);
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    public function isOverdue(): bool
    {
        return $this->status === 'pending' && $this->due_date->isPast();
    }

    public static function generateInvoiceNumber(string $tenantId): string
    {
        $prefix = 'INV';
        $year = now()->format('Y');
        $sequence = static::where('tenant_id', $tenantId)
            ->whereYear('created_at', now()->year)
            ->count() + 1;
        
        return sprintf('%s-%s-%05d', $prefix, $year, $sequence);
    }
}
