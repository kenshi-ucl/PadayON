<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Category extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'parent_id', 'name', 'name_tl', 'slug', 'description',
        'image', 'icon', 'color', 'type', 'sort_order', 'is_active',
    ];

    protected $casts = ['is_active' => 'boolean'];

    public function parent() { return $this->belongsTo(Category::class, 'parent_id'); }
    public function children() { return $this->hasMany(Category::class, 'parent_id'); }
    public function products() { return $this->hasMany(Product::class); }
    public function menuItems() { return $this->hasMany(MenuItem::class); }
    
    public function scopeActive($query) { return $query->where('is_active', true); }
    public function scopeByType($query, string $type) { return $query->where('type', $type); }
    public function scopeRoots($query) { return $query->whereNull('parent_id'); }
}
