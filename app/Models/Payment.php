<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payment extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'order_id', 'customer_id', 'user_id', 'payment_number',
        'type', 'amount', 'fee', 'net_amount', 'currency', 'method', 'channel',
        'gateway', 'gateway_id', 'gateway_status', 'gateway_response', 'status',
        'is_cod', 'cod_collected_at', 'cod_collector', 'reference_number',
        'notes', 'paid_at', 'refunded_at', 'metadata',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'fee' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'is_cod' => 'boolean',
        'cod_collected_at' => 'datetime',
        'paid_at' => 'datetime',
        'refunded_at' => 'datetime',
        'gateway_response' => 'array',
        'metadata' => 'array',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';
    const STATUS_REFUNDED = 'refunded';

    public static function generatePaymentNumber(string $tenantId): string
    {
        $prefix = 'PAY';
        $date   = now()->format('ymd');

        // CRITICAL: Use withoutGlobalScopes() to check ALL records across ALL tenants.
        // The DB constraint 'payments_payment_number_unique' is global (not tenant-scoped),
        // so we must query globally to prevent cross-tenant collisions.
        $last = static::withoutGlobalScopes()
            ->withTrashed()
            ->where('payment_number', 'like', "{$prefix}-{$date}-%")
            ->max('payment_number');

        $lastSeq = $last ? (int) substr($last, strrpos($last, '-') + 1) : 0;

        // Increment until we find a globally unique number (trashed or not)
        do {
            $lastSeq++;
            $candidate = sprintf('%s-%s-%04d', $prefix, $date, $lastSeq);
        } while (static::withoutGlobalScopes()->withTrashed()->where('payment_number', $candidate)->exists());

        return $candidate;
    }

    public function order() { return $this->belongsTo(Order::class); }
    public function customer() { return $this->belongsTo(Customer::class); }
    public function user() { return $this->belongsTo(User::class); }

    public function isCompleted(): bool { return $this->status === self::STATUS_COMPLETED; }
    public function isPending(): bool { return $this->status === self::STATUS_PENDING; }
    
    public function getFormattedAmount(): string { return '₱' . number_format($this->amount, 2); }
    
    public function getMethodLabel(): string
    {
        return match($this->method) {
            'cash' => 'Cash',
            'gcash' => 'GCash',
            'maya' => 'Maya',
            'card' => 'Credit/Debit Card',
            'bank_transfer' => 'Bank Transfer',
            'cod' => 'Cash on Delivery',
            default => ucfirst($this->method),
        };
    }
}
