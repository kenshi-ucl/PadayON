<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\SmsMessage;
use App\Models\SmsTemplate;
use App\Models\Tenant;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    protected string $apiKey;
    protected string $senderName;
    protected string $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('services.semaphore.api_key');
        $this->senderName = config('services.semaphore.sender_name', 'PadayON');
        $this->baseUrl = config('services.semaphore.base_url', 'https://api.semaphore.co/api/v4');
    }

    /**
     * Send SMS message
     */
    public function send(string $to, string $message, ?Tenant $tenant = null, ?Customer $customer = null): SmsMessage
    {
        // Format Philippine mobile number
        $to = $this->formatPhoneNumber($to);

        // Check tenant SMS limits
        if ($tenant && !$this->canSendSms($tenant)) {
            throw new \Exception('SMS limit exceeded for this billing period');
        }

        // Create SMS record
        $smsMessage = SmsMessage::create([
            'tenant_id' => $tenant?->id,
            'customer_id' => $customer?->id,
            'user_id' => auth()->id(),
            'to' => $to,
            'from' => $this->senderName,
            'message' => $message,
            'type' => 'transactional',
            'provider' => 'semaphore',
            'status' => 'pending',
            'segments' => $this->calculateSegments($message),
            'cost' => $this->calculateCost($message),
        ]);

        try {
            $response = Http::post("{$this->baseUrl}/messages", [
                'apikey' => $this->apiKey,
                'number' => $to,
                'message' => $message,
                'sendername' => $this->senderName,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $smsMessage->update([
                    'provider_id' => $data[0]['message_id'] ?? null,
                    'status' => 'sent',
                    'sent_at' => now(),
                ]);
            } else {
                $smsMessage->update([
                    'status' => 'failed',
                    'error_message' => $response->json('message', 'Unknown error'),
                ]);
            }
        } catch (\Exception $e) {
            Log::error('SMS sending failed', [
                'to' => $to,
                'error' => $e->getMessage(),
            ]);

            $smsMessage->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);
        }

        return $smsMessage;
    }

    /**
     * Send SMS using a template
     */
    public function sendTemplate(string $to, string $templateSlug, array $variables = [], ?Tenant $tenant = null, ?Customer $customer = null): SmsMessage
    {
        $template = SmsTemplate::where('tenant_id', $tenant?->id)
            ->where('slug', $templateSlug)
            ->where('is_active', true)
            ->first();

        if (!$template) {
            // Try system template
            $template = SmsTemplate::whereNull('tenant_id')
                ->where('slug', $templateSlug)
                ->where('is_system', true)
                ->first();
        }

        if (!$template) {
            throw new \Exception("SMS template '{$templateSlug}' not found");
        }

        $message = $this->parseTemplate($template->content, $variables);

        $smsMessage = $this->send($to, $message, $tenant, $customer);
        $smsMessage->update(['template' => $templateSlug]);

        return $smsMessage;
    }

    /**
     * Send credit reminder SMS
     */
    public function sendCreditReminder(Customer $customer): ?SmsMessage
    {
        if (!$customer->phone || $customer->current_balance <= 0) {
            return null;
        }

        $tenant = $customer->tenant;

        return $this->sendTemplate(
            $customer->phone,
            'credit_reminder',
            [
                'customer_name' => $customer->name,
                'balance' => number_format($customer->current_balance, 2),
                'store_name' => $tenant->business_name ?? $tenant->name,
                'days_overdue' => $customer->getDaysOverdue(),
            ],
            $tenant,
            $customer
        );
    }

    /**
     * Send order confirmation SMS
     */
    public function sendOrderConfirmation(Order $order): ?SmsMessage
    {
        $phone = $order->customer_phone ?? $order->customer?->phone;

        if (!$phone) {
            return null;
        }

        return $this->sendTemplate(
            $phone,
            'order_confirmation',
            [
                'customer_name' => $order->getCustomerDisplayName(),
                'order_number' => $order->order_number,
                'total' => number_format($order->total, 2),
                'store_name' => $order->tenant->business_name ?? $order->tenant->name,
            ],
            $order->tenant,
            $order->customer
        );
    }

    /**
     * Check if tenant can send SMS
     */
    public function canSendSms(Tenant $tenant): bool
    {
        $plan = $tenant->plan;
        $limit = config("padayon.plans.{$plan}.features.sms_limit");

        if ($limit === null) {
            return true; // Unlimited
        }

        $sentThisMonth = SmsMessage::where('tenant_id', $tenant->id)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->where('status', '!=', 'failed')
            ->count();

        return $sentThisMonth < $limit;
    }

    /**
     * Get remaining SMS for tenant
     */
    public function getRemainingSmS(Tenant $tenant): ?int
    {
        $plan = $tenant->plan;
        $limit = config("padayon.plans.{$plan}.features.sms_limit");

        if ($limit === null) {
            return null; // Unlimited
        }

        $sentThisMonth = SmsMessage::where('tenant_id', $tenant->id)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->where('status', '!=', 'failed')
            ->count();

        return max(0, $limit - $sentThisMonth);
    }

    /**
     * Format Philippine phone number
     */
    protected function formatPhoneNumber(string $number): string
    {
        // Remove spaces, dashes, and other characters
        $number = preg_replace('/[^0-9+]/', '', $number);

        // If starts with 0, replace with +63
        if (str_starts_with($number, '0')) {
            $number = '+63' . substr($number, 1);
        }

        // If starts with 63, add +
        if (str_starts_with($number, '63') && !str_starts_with($number, '+63')) {
            $number = '+' . $number;
        }

        // If doesn't start with +, assume Philippine number
        if (!str_starts_with($number, '+')) {
            $number = '+63' . $number;
        }

        return $number;
    }

    /**
     * Parse template with variables
     */
    protected function parseTemplate(string $template, array $variables): string
    {
        foreach ($variables as $key => $value) {
            $template = str_replace("{{$key}}", $value, $template);
            $template = str_replace("{{ $key }}", $value, $template);
        }

        return $template;
    }

    /**
     * Calculate SMS segments
     */
    protected function calculateSegments(string $message): int
    {
        $length = mb_strlen($message);

        if ($length <= 160) {
            return 1;
        }

        return (int) ceil($length / 153);
    }

    /**
     * Calculate SMS cost
     */
    protected function calculateCost(string $message): float
    {
        $segments = $this->calculateSegments($message);
        $costPerSms = config('services.semaphore.cost_per_sms', 0.50);

        return $segments * $costPerSms;
    }
}
