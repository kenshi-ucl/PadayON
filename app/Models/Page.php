<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Page extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'title',
        'slug',
        'excerpt',
        'content',
        'gjs_data',
        'html',
        'css',
        'meta_title',
        'meta_description',
        'featured_image',
        'is_published',
        'is_homepage',
        'show_in_nav',
        'sort_order',
        'published_at',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'is_homepage' => 'boolean',
        'show_in_nav' => 'boolean',
        'published_at' => 'datetime',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    public function scopeInNav($query)
    {
        return $query->where('show_in_nav', true)->orderBy('sort_order');
    }
}
