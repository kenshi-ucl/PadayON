<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Product extends Model implements HasMedia
{
    use HasFactory, SoftDeletes, BelongsToTenant, InteractsWithMedia;

    protected $fillable = [
        'tenant_id',
        'category_id',
        'name',
        'name_tl',
        'sku',
        'barcode',
        'qr_token',
        'description',
        'cost_price',
        'selling_price',
        'wholesale_price',
        'compare_price',
        'is_taxable',
        'tax_rate',
        'stock_quantity',
        'low_stock_threshold',
        'stock_unit',
        'unit_weight',
        'track_inventory',
        'allow_backorder',
        'allow_tingi',
        'pieces_per_pack',
        'tingi_price',
        'image',
        'gallery',
        'is_active',
        'is_featured',
        'sort_order',
        'is_eload',
        'eload_network',
        'eload_type',
        'metadata',
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'wholesale_price' => 'decimal:2',
        'compare_price' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'unit_weight' => 'decimal:3',
        'tingi_price' => 'decimal:2',
        'is_taxable' => 'boolean',
        'track_inventory' => 'boolean',
        'allow_backorder' => 'boolean',
        'allow_tingi' => 'boolean',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'is_eload' => 'boolean',
        'gallery' => 'array',
        'metadata' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($product) {
            if (empty($product->qr_token)) {
                $product->qr_token = Str::uuid()->toString();
            }
        });
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('image')->singleFile();
        $this->addMediaCollection('gallery');
    }

    // Relationships
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeLowStock($query)
    {
        return $query->whereColumn('stock_quantity', '<=', 'low_stock_threshold');
    }

    public function scopeOutOfStock($query)
    {
        return $query->where('stock_quantity', '<=', 0);
    }

    public function scopeInStock($query)
    {
        return $query->where('stock_quantity', '>', 0);
    }

    public function scopeEload($query)
    {
        return $query->where('is_eload', true);
    }

    // Stock Management
    public function isLowStock(): bool
    {
        return $this->track_inventory && $this->stock_quantity <= $this->low_stock_threshold;
    }

    public function isOutOfStock(): bool
    {
        return $this->track_inventory && $this->stock_quantity <= 0;
    }

    public function isInStock(): bool
    {
        return !$this->track_inventory || $this->stock_quantity > 0;
    }

    public function canSell(float $quantity = 1): bool
    {
        if (!$this->track_inventory) {
            return true;
        }
        return $this->stock_quantity >= $quantity || $this->allow_backorder;
    }

    public function adjustStock(int $quantity, string $type, ?int $userId = null, ?string $notes = null, ?Model $reference = null): StockMovement
    {
        $stockBefore = $this->stock_quantity;
        $this->stock_quantity += $quantity;
        $this->save();

        return $this->stockMovements()->create([
            'tenant_id' => $this->tenant_id,
            'user_id' => $userId,
            'type' => $type,
            'quantity' => $quantity,
            'stock_before' => $stockBefore,
            'stock_after' => $this->stock_quantity,
            'reference_type' => $reference ? get_class($reference) : null,
            'reference_id' => $reference?->id,
            'notes' => $notes,
        ]);
    }

    public function decrementStock(float $quantity, string $type = 'sale', ?int $userId = null, ?Model $reference = null): StockMovement
    {
        return $this->adjustStock(-$quantity, $type, $userId, null, $reference);
    }

    public function incrementStock(float $quantity, string $type = 'purchase', ?int $userId = null, ?Model $reference = null): StockMovement
    {
        return $this->adjustStock($quantity, $type, $userId, null, $reference);
    }

    // Pricing
    public function getProfit(): float
    {
        return $this->selling_price - $this->cost_price;
    }

    public function getProfitMargin(): float
    {
        if ($this->selling_price <= 0) {
            return 0;
        }
        return ($this->getProfit() / $this->selling_price) * 100;
    }

    public function getEffectivePrice(bool $isTingi = false): float
    {
        if ($isTingi && $this->allow_tingi && $this->tingi_price) {
            return $this->tingi_price;
        }
        return $this->selling_price;
    }

    public function hasDiscount(): bool
    {
        return $this->compare_price && $this->compare_price > $this->selling_price;
    }

    public function getDiscountPercentage(): float
    {
        if (!$this->hasDiscount()) {
            return 0;
        }
        return round((($this->compare_price - $this->selling_price) / $this->compare_price) * 100);
    }

    // Formatting
    public function getFormattedPrice(): string
    {
        return '₱' . number_format($this->selling_price, 2);
    }

    public function getFormattedCost(): string
    {
        return '₱' . number_format($this->cost_price, 2);
    }

    public function getImageUrl(): ?string
    {
        if ($this->image) {
            return asset('storage/' . $this->image);
        }
        return $this->getFirstMediaUrl('image') ?: null;
    }
}
