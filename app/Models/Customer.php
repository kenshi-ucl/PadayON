<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Customer extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant, LogsActivity;

    protected $fillable = [
        'tenant_id',
        'name',
        'email',
        'phone',
        'address',
        'city',
        'barangay',
        'latitude',
        'longitude',
        'credit_limit',
        'current_balance',
        'credit_enabled',
        'last_credit_date',
        'last_payment_date',
        'total_orders',
        'total_spent',
        'loyalty_points',
        'is_active',
        'is_suki',
        'notes',
        'metadata',
    ];

    protected $casts = [
        'credit_limit' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'total_spent' => 'decimal:2',
        'credit_enabled' => 'boolean',
        'is_active' => 'boolean',
        'is_suki' => 'boolean',
        'last_credit_date' => 'date',
        'last_payment_date' => 'date',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'metadata' => 'array',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'credit_limit', 'credit_enabled', 'is_active'])
            ->logOnlyDirty();
    }

    // Relationships
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function creditTransactions()
    {
        return $this->hasMany(CreditTransaction::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeWithCredit($query)
    {
        return $query->where('current_balance', '>', 0);
    }

    public function scopeSuki($query)
    {
        return $query->where('is_suki', true);
    }

    public function scopeOverdueCredit($query, int $days = 30)
    {
        return $query->where('current_balance', '>', 0)
            ->where('last_credit_date', '<=', now()->subDays($days));
    }

    // Credit/Utang Methods
    public function hasAvailableCredit(): bool
    {
        if (!$this->credit_enabled) {
            return false;
        }
        return $this->current_balance < $this->credit_limit;
    }

    public function getAvailableCredit(): float
    {
        if (!$this->credit_enabled) {
            return 0;
        }
        return max(0, $this->credit_limit - $this->current_balance);
    }

    public function addCredit(float $amount, ?Order $order = null, ?string $description = null): CreditTransaction
    {
        $balanceBefore = $this->current_balance;
        $this->current_balance += $amount;
        $this->last_credit_date = now();
        $this->save();

        return $this->creditTransactions()->create([
            'tenant_id' => $this->tenant_id,
            'order_id' => $order?->id,
            'type' => 'credit',
            'amount' => $amount,
            'balance_before' => $balanceBefore,
            'balance_after' => $this->current_balance,
            'description' => $description ?? 'Credit purchase',
        ]);
    }

    public function recordPayment(float $amount, ?Payment $payment = null, ?string $description = null): CreditTransaction
    {
        $balanceBefore = $this->current_balance;
        $this->current_balance = max(0, $this->current_balance - $amount);
        $this->last_payment_date = now();
        $this->save();

        return $this->creditTransactions()->create([
            'tenant_id' => $this->tenant_id,
            'payment_id' => $payment?->id,
            'type' => 'payment',
            'amount' => $amount,
            'balance_before' => $balanceBefore,
            'balance_after' => $this->current_balance,
            'description' => $description ?? 'Credit payment',
        ]);
    }

    public function getDaysOverdue(): int
    {
        if ($this->current_balance <= 0 || !$this->last_credit_date) {
            return 0;
        }
        return max(0, now()->diffInDays($this->last_credit_date));
    }

    // Stats
    public function incrementOrderStats(float $amount): void
    {
        $this->increment('total_orders');
        $this->increment('total_spent', $amount);

        // Auto-suki after 10 orders
        if ($this->total_orders >= 10 && !$this->is_suki) {
            $this->is_suki = true;
            $this->save();
        }
    }

    public function getFormattedBalance(): string
    {
        return '₱' . number_format($this->current_balance, 2);
    }

    public function getFormattedCreditLimit(): string
    {
        return '₱' . number_format($this->credit_limit, 2);
    }

    public function getFormattedAddress(): string
    {
        return collect([$this->address, $this->barangay, $this->city])
            ->filter()
            ->implode(', ');
    }
}
