<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;
use Stancl\Tenancy\Database\Concerns\HasDomains;

class Tenant extends BaseTenant
{
    use HasFactory, HasDomains, SoftDeletes;

    protected $fillable = [
        'id',
        'name',
        'slug',
        'business_type',
        'plan',
        'email',
        'phone',
        'logo',
        'timezone',
        'currency',
        'locale',
        'business_name',
        'business_address',
        'city',
        'province',
        'region',
        'postal_code',
        'latitude',
        'longitude',
        'dti_registration',
        'bir_tin',
        'sec_registration',
        'mayors_permit',
        'paymongo_account_id',
        'gcash_enabled',
        'maya_enabled',
        'card_enabled',
        'cod_enabled',
        'trial_ends_at',
        'subscription_ends_at',
        'is_active',
        'settings',
        'features',
        'data',
    ];

    protected $casts = [
        'gcash_enabled' => 'boolean',
        'maya_enabled' => 'boolean',
        'card_enabled' => 'boolean',
        'cod_enabled' => 'boolean',
        'is_active' => 'boolean',
        'trial_ends_at' => 'datetime',
        'subscription_ends_at' => 'datetime',
        'settings' => 'array',
        'features' => 'array',
        'data' => 'array',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
    ];

    public static function getCustomColumns(): array
    {
        return [
            'id',
            'name',
            'slug',
            'business_type',
            'plan',
            'email',
            'phone',
            'logo',
            'timezone',
            'currency',
            'locale',
            'business_name',
            'business_address',
            'city',
            'province',
            'region',
            'postal_code',
            'latitude',
            'longitude',
            'dti_registration',
            'bir_tin',
            'sec_registration',
            'mayors_permit',
            'paymongo_account_id',
            'gcash_enabled',
            'maya_enabled',
            'card_enabled',
            'cod_enabled',
            'trial_ends_at',
            'subscription_ends_at',
            'is_active',
            'settings',
            'features',
            'data',
        ];
    }

    // Relationships
    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function customers()
    {
        return $this->hasMany(Customer::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function categories()
    {
        return $this->hasMany(Category::class);
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    public function website()
    {
        return $this->hasOne(Website::class);
    }

    public function activeSubscription()
    {
        return $this->hasOne(Subscription::class)
            ->where('status', 'active')
            ->latest();
    }

    // Helpers
    public function hasFeature(string $feature): bool
    {
        $features = $this->features ?? config('padayon.default_features', []);
        return in_array($feature, $features);
    }

    public function isOnTrial(): bool
    {
        return $this->trial_ends_at && $this->trial_ends_at->isFuture();
    }

    public function hasActiveSubscription(): bool
    {
        return $this->subscription_ends_at && $this->subscription_ends_at->isFuture();
    }

    public function canAccess(string $feature): bool
    {
        $planFeatures = config("padayon.plans.{$this->plan}.features", []);
        return $planFeatures[$feature] ?? false;
    }

    public function getPlanLimit(string $feature): mixed
    {
        return config("padayon.plans.{$this->plan}.features.{$feature}");
    }

    public function getSubdomain(): string
    {
        return $this->slug . config('padayon.website.subdomain_suffix');
    }

    public function getFormattedAddress(): string
    {
        return collect([
            $this->business_address,
            $this->city,
            $this->province,
            $this->postal_code,
        ])->filter()->implode(', ');
    }
}
