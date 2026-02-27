<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class CreditTransaction extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'customer_id', 'order_id', 'payment_id', 'user_id',
        'type', 'amount', 'balance_before', 'balance_after', 'description', 'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_before' => 'decimal:2',
        'balance_after' => 'decimal:2',
    ];

    public function customer() { return $this->belongsTo(Customer::class); }
    public function order() { return $this->belongsTo(Order::class); }
    public function payment() { return $this->belongsTo(Payment::class); }
    public function user() { return $this->belongsTo(User::class); }

    public function isCredit(): bool { return $this->type === 'credit'; }
    public function isPayment(): bool { return $this->type === 'payment'; }
}
