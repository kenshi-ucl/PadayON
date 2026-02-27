<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CashRegister extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'register_date',
        'opening_balance',
        'opened_at',
        'cash_sales',
        'cash_refunds',
        'cash_in',
        'cash_out',
        'expected_balance',
        'actual_balance',
        'difference',
        'closed_at',
        'status',
        'notes',
    ];

    protected $casts = [
        'register_date' => 'date',
        'opening_balance' => 'decimal:2',
        'cash_sales' => 'decimal:2',
        'cash_refunds' => 'decimal:2',
        'cash_in' => 'decimal:2',
        'cash_out' => 'decimal:2',
        'expected_balance' => 'decimal:2',
        'actual_balance' => 'decimal:2',
        'difference' => 'decimal:2',
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    public function scopeClosed($query)
    {
        return $query->where('status', 'closed');
    }

    public function isOpen(): bool
    {
        return $this->status === 'open';
    }

    public function calculateExpectedBalance(): float
    {
        return $this->opening_balance 
             + $this->cash_sales 
             - $this->cash_refunds 
             + $this->cash_in 
             - $this->cash_out;
    }

    public function close(float $actualBalance, ?string $notes = null): void
    {
        $this->expected_balance = $this->calculateExpectedBalance();
        $this->actual_balance = $actualBalance;
        $this->difference = $actualBalance - $this->expected_balance;
        $this->closed_at = now();
        $this->status = 'closed';
        $this->notes = $notes;
        $this->save();
    }

    public static function openRegister(float $openingBalance): self
    {
        return self::create([
            'tenant_id' => tenant()->id,
            'user_id' => auth()->id(),
            'register_date' => today(),
            'opening_balance' => $openingBalance,
            'opened_at' => now(),
            'cash_sales' => 0,
            'cash_refunds' => 0,
            'cash_in' => 0,
            'cash_out' => 0,
            'status' => 'open',
        ]);
    }
}
