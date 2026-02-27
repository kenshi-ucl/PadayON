<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Website extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'template',
        'is_published',
        'logo',
        'favicon',
        'primary_color',
        'secondary_color',
        'accent_color',
        'tagline',
        'about',
        'social_links',
        'business_hours',
        'meta_title',
        'meta_description',
        'meta_image',
        'meta_keywords',
        'google_analytics_id',
        'facebook_pixel_id',
        'custom_css',
        'custom_js',
        'head_code',
        'body_code',
        'settings',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'social_links' => 'array',
        'business_hours' => 'array',
        'meta_keywords' => 'array',
        'settings' => 'array',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function pages()
    {
        return $this->hasManyThrough(Page::class, Tenant::class, 'id', 'tenant_id', 'tenant_id', 'id');
    }

    public function getLogoUrl(): ?string
    {
        return $this->logo ? asset('storage/' . $this->logo) : null;
    }

    public function getFaviconUrl(): ?string
    {
        return $this->favicon ? asset('storage/' . $this->favicon) : null;
    }
}
