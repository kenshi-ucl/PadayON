<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class SmsMessage extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'customer_id', 'user_id', 'to', 'from', 'message', 'type',
        'template', 'provider', 'provider_id', 'status', 'error_message', 'cost',
        'segments', 'sent_at', 'delivered_at', 'metadata',
    ];

    protected $casts = [
        'cost' => 'decimal:2',
        'sent_at' => 'datetime',
        'delivered_at' => 'datetime',
        'metadata' => 'array',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_SENT = 'sent';
    const STATUS_DELIVERED = 'delivered';
    const STATUS_FAILED = 'failed';

    public function customer() { return $this->belongsTo(Customer::class); }
    public function user() { return $this->belongsTo(User::class); }

    public function scopePending($query) { return $query->where('status', self::STATUS_PENDING); }
    public function scopeSent($query) { return $query->where('status', self::STATUS_SENT); }
    public function scopeFailed($query) { return $query->where('status', self::STATUS_FAILED); }

    public function markAsSent(string $providerId): void
    {
        $this->update([
            'status' => self::STATUS_SENT,
            'provider_id' => $providerId,
            'sent_at' => now(),
        ]);
    }

    public function markAsDelivered(): void
    {
        $this->update([
            'status' => self::STATUS_DELIVERED,
            'delivered_at' => now(),
        ]);
    }

    public function markAsFailed(string $error): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'error_message' => $error,
        ]);
    }
}
