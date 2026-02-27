<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'product_id', 'user_id', 'type', 'quantity',
        'stock_before', 'stock_after', 'unit_cost', 'reference_type',
        'reference_id', 'notes',
    ];

    protected $casts = [
        'unit_cost' => 'decimal:2',
    ];

    const TYPE_PURCHASE = 'purchase';
    const TYPE_SALE = 'sale';
    const TYPE_ADJUSTMENT = 'adjustment';
    const TYPE_TRANSFER = 'transfer';
    const TYPE_RETURN = 'return';
    const TYPE_DAMAGE = 'damage';

    public function product() { return $this->belongsTo(Product::class); }
    public function user() { return $this->belongsTo(User::class); }
    
    public function reference()
    {
        return $this->morphTo('reference', 'reference_type', 'reference_id');
    }

    public function isIncoming(): bool { return $this->quantity > 0; }
    public function isOutgoing(): bool { return $this->quantity < 0; }
    
    public function getTypeLabel(): string
    {
        return match($this->type) {
            self::TYPE_PURCHASE => 'Purchase',
            self::TYPE_SALE => 'Sale',
            self::TYPE_ADJUSTMENT => 'Adjustment',
            self::TYPE_TRANSFER => 'Transfer',
            self::TYPE_RETURN => 'Return',
            self::TYPE_DAMAGE => 'Damage',
            default => ucfirst($this->type),
        };
    }
}
