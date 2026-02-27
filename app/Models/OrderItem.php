<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'order_id', 'product_id', 'name', 'sku', 'description',
        'unit_price', 'cost_price', 'quantity', 'unit', 'discount_amount',
        'tax_amount', 'total', 'notes', 'options', 'metadata',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'quantity' => 'decimal:3',
        'discount_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total' => 'decimal:2',
        'options' => 'array',
        'metadata' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();
        static::saving(function ($item) {
            $item->total = ($item->unit_price * $item->quantity) - $item->discount_amount + $item->tax_amount;
        });
    }

    public function order() { return $this->belongsTo(Order::class); }
    public function product() { return $this->belongsTo(Product::class); }
    
    public function getProfit(): float
    {
        return ($this->unit_price - $this->cost_price) * $this->quantity;
    }
}
