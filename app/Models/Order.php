<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Order extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant, LogsActivity;

    protected $fillable = [
        'tenant_id',
        'customer_id',
        'user_id',
        'order_number',
        'type',
        'status',
        'payment_status',
        'fulfillment_status',
        'subtotal',
        'discount_amount',
        'discount_type',
        'discount_value',
        'discount_reason',
        'tax_amount',
        'delivery_fee',
        'service_fee',
        'total',
        'amount_paid',
        'change_amount',
        'balance_due',
        'is_credit',
        'credit_due_date',
        'payment_method',
        'payment_reference',
        'paid_at',
        'is_delivery',
        'delivery_address',
        'delivery_barangay',
        'delivery_city',
        'delivery_lat',
        'delivery_lng',
        'delivery_slot',
        'delivery_date',
        'delivery_status',
        'tracking_number',
        'customer_name',
        'customer_phone',
        'customer_email',
        'notes',
        'internal_notes',
        'source',
        'device',
        'metadata',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'discount_value' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'delivery_fee' => 'decimal:2',
        'service_fee' => 'decimal:2',
        'total' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'change_amount' => 'decimal:2',
        'balance_due' => 'decimal:2',
        'is_credit' => 'boolean',
        'is_delivery' => 'boolean',
        'credit_due_date' => 'date',
        'delivery_date' => 'date',
        'paid_at' => 'datetime',
        'delivery_lat' => 'decimal:8',
        'delivery_lng' => 'decimal:8',
        'metadata' => 'array',
    ];

    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_REFUNDED = 'refunded';

    const PAYMENT_STATUS_UNPAID = 'unpaid';
    const PAYMENT_STATUS_PARTIAL = 'partial';
    const PAYMENT_STATUS_PAID = 'paid';
    const PAYMENT_STATUS_REFUNDED = 'refunded';

    const FULFILLMENT_UNFULFILLED = 'unfulfilled';
    const FULFILLMENT_PROCESSING = 'processing';
    const FULFILLMENT_FULFILLED = 'fulfilled';
    const FULFILLMENT_DELIVERED = 'delivered';

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'payment_status', 'fulfillment_status', 'total'])
            ->logOnlyDirty();
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($order) {
            if (!$order->order_number) {
                $order->order_number = static::generateOrderNumber($order->tenant_id);
            }
        });
    }

    public static function generateOrderNumber(string $tenantId): string
    {
        $prefix = strtoupper(substr($tenantId, 0, 3));
        $date   = now()->format('ymd');

        // Use withTrashed() so soft-deleted orders are still counted
        $last = static::withTrashed()
            ->where('tenant_id', $tenantId)
            ->where('order_number', 'like', "{$prefix}-{$date}-%")
            ->max('order_number');

        $lastSeq = $last ? (int) substr($last, strrpos($last, '-') + 1) : 0;

        do {
            $lastSeq++;
            $candidate = sprintf('%s-%s-%04d', $prefix, $date, $lastSeq);
        } while (static::withTrashed()->where('order_number', $candidate)->exists());

        return $candidate;
    }

    // Relationships
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }


    public function creditTransaction()
    {
        return $this->hasOne(CreditTransaction::class);
    }

    // Scopes
    public function scopeToday($query)
    {
        return $query->whereDate('created_at', today());
    }

    public function scopeThisWeek($query)
    {
        return $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
    }

    public function scopeThisMonth($query)
    {
        return $query->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year);
    }

    public function scopePaid($query)
    {
        return $query->where('payment_status', self::PAYMENT_STATUS_PAID);
    }

    public function scopeUnpaid($query)
    {
        return $query->where('payment_status', self::PAYMENT_STATUS_UNPAID);
    }

    public function scopeCredit($query)
    {
        return $query->where('is_credit', true);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    // Status Checks
    public function isPaid(): bool
    {
        return $this->payment_status === self::PAYMENT_STATUS_PAID;
    }

    public function isPartiallyPaid(): bool
    {
        return $this->payment_status === self::PAYMENT_STATUS_PARTIAL;
    }

    public function isUnpaid(): bool
    {
        return $this->payment_status === self::PAYMENT_STATUS_UNPAID;
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, [self::STATUS_PENDING, self::STATUS_CONFIRMED]);
    }

    // Calculations
    public function calculateTotals(): void
    {
        $this->subtotal = $this->items->sum('total');
        $this->tax_amount = $this->calculateTax();
        $this->total = $this->subtotal - $this->discount_amount + $this->tax_amount + $this->delivery_fee + $this->service_fee;
        $this->balance_due = max(0, $this->total - $this->amount_paid);
    }

    public function calculateTax(): float
    {
        // Avoid lazy loading - only check product if already loaded
        $taxableAmount = $this->items
            ->filter(function ($item) {
                // If product is not loaded, assume taxable
                if (!$item->relationLoaded('product')) {
                    return true;
                }
                return $item->product?->is_taxable ?? true;
            })
            ->sum('total');

        $taxRate = config('padayon.tax.vat_rate', 12);
        return round($taxableAmount * ($taxRate / 100), 2);
    }

    public function applyDiscount(string $type, float $value, ?string $reason = null): void
    {
        $this->discount_type = $type;
        $this->discount_value = $value;
        $this->discount_reason = $reason;

        if ($type === 'percentage') {
            $this->discount_amount = round($this->subtotal * ($value / 100), 2);
        } else {
            $this->discount_amount = min($value, $this->subtotal);
        }

        $this->calculateTotals();
    }

    public function recordPayment(float $amount, string $method, ?string $reference = null): Payment
    {
        $maxAttempts = 5;
        $attempt     = 0;
        $payment     = null;

        while ($attempt < $maxAttempts) {
            $attempt++;
            try {
                $payment = \Illuminate\Support\Facades\DB::transaction(function () use ($amount, $method, $reference) {
                    return $this->payments()->create([
                        'tenant_id'        => $this->tenant_id,
                        'customer_id'      => $this->customer_id,
                        'user_id'          => auth()->id(),
                        'payment_number'   => Payment::generatePaymentNumber($this->tenant_id),
                        'type'             => 'order',
                        'amount'           => $amount,
                        'fee'              => 0,
                        'net_amount'       => $amount,
                        'method'           => $method,
                        'gateway'          => $method === 'cash' ? 'manual' : 'paymongo',
                        'status'           => 'completed',
                        'reference_number' => $reference,
                        'paid_at'          => now(),
                    ]);
                });
                break; // success, exit loop
            } catch (\Illuminate\Database\QueryException $e) {
                // Retry if it's a unique constraint violation on payment_number
                if ($attempt < $maxAttempts && str_contains($e->getMessage(), 'payment_number')) {
                    continue;
                }
                throw $e; // re-throw if not retryable or exhausted
            }
        }

        $this->amount_paid   += $amount;
        $this->balance_due    = max(0, $this->total - $this->amount_paid);
        $this->change_amount  = max(0, $this->amount_paid - $this->total);

        if ($this->balance_due <= 0) {
            $this->payment_status = self::PAYMENT_STATUS_PAID;
            $this->paid_at        = now();
        } elseif ($this->amount_paid > 0) {
            $this->payment_status = self::PAYMENT_STATUS_PARTIAL;
        }

        $this->payment_method    = $method;
        $this->payment_reference = $reference;
        $this->save();

        return $payment;
    }

    // Formatting
    public function getFormattedTotal(): string
    {
        return '₱' . number_format($this->total, 2);
    }

    public function getFormattedBalanceDue(): string
    {
        return '₱' . number_format($this->balance_due, 2);
    }

    public function getCustomerDisplayName(): string
    {
        return $this->customer?->name ?? $this->customer_name ?? 'Walk-in Customer';
    }

    public function getStatusBadgeColor(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING => 'yellow',
            self::STATUS_CONFIRMED => 'blue',
            self::STATUS_PROCESSING => 'indigo',
            self::STATUS_COMPLETED => 'green',
            self::STATUS_CANCELLED => 'red',
            self::STATUS_REFUNDED => 'gray',
            default => 'gray',
        };
    }

    public function getPaymentStatusBadgeColor(): string
    {
        return match ($this->payment_status) {
            self::PAYMENT_STATUS_PAID => 'green',
            self::PAYMENT_STATUS_PARTIAL => 'yellow',
            self::PAYMENT_STATUS_UNPAID => 'red',
            self::PAYMENT_STATUS_REFUNDED => 'gray',
            default => 'gray',
        };
    }
}
