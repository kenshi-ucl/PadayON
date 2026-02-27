<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Tenant;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PayMongoService
{
    protected string $baseUrl = 'https://api.paymongo.com/v1';
    protected string $secretKey;
    protected string $publicKey;

    public function __construct()
    {
        $this->secretKey = config('paymongo.secret_key');
        $this->publicKey = config('paymongo.public_key');
    }

    /**
     * Create a payment intent
     */
    public function createPaymentIntent(int $amount, array $paymentMethods = ['gcash', 'grab_pay', 'paymaya', 'card'], array $metadata = []): array
    {
        $response = Http::withBasicAuth($this->secretKey, '')
            ->post("{$this->baseUrl}/payment_intents", [
                'data' => [
                    'attributes' => [
                        'amount' => $amount * 100, // Convert to centavos
                        'payment_method_allowed' => $paymentMethods,
                        'currency' => 'PHP',
                        'capture_type' => 'automatic',
                        'metadata' => $metadata,
                    ],
                ],
            ]);

        if ($response->failed()) {
            Log::error('PayMongo Payment Intent Error', [
                'status' => $response->status(),
                'body' => $response->json(),
            ]);
            throw new \Exception('Failed to create payment intent: ' . $response->json('errors.0.detail', 'Unknown error'));
        }

        return $response->json('data');
    }

    /**
     * Create a checkout session (hosted checkout page)
     */
    public function createCheckoutSession(Order $order, array $lineItems = [], ?string $successUrl = null, ?string $cancelUrl = null): array
    {
        $tenant = $order->tenant;
        
        $lineItems = empty($lineItems) ? $this->formatOrderLineItems($order) : $lineItems;
        
        $response = Http::withBasicAuth($this->secretKey, '')
            ->post("{$this->baseUrl}/checkout_sessions", [
                'data' => [
                    'attributes' => [
                        'billing' => [
                            'name' => $order->getCustomerDisplayName(),
                            'email' => $order->customer_email ?? $order->customer?->email,
                            'phone' => $order->customer_phone ?? $order->customer?->phone,
                        ],
                        'line_items' => $lineItems,
                        'payment_method_types' => $this->getEnabledPaymentMethods($tenant),
                        'success_url' => $successUrl ?? url('/payment/success?session_id={CHECKOUT_SESSION_ID}'),
                        'cancel_url' => $cancelUrl ?? url('/payment/cancel'),
                        'description' => "Order #{$order->order_number}",
                        'metadata' => [
                            'order_id' => $order->id,
                            'order_number' => $order->order_number,
                            'tenant_id' => $order->tenant_id,
                        ],
                    ],
                ],
            ]);

        if ($response->failed()) {
            Log::error('PayMongo Checkout Session Error', [
                'status' => $response->status(),
                'body' => $response->json(),
            ]);
            throw new \Exception('Failed to create checkout session');
        }

        return $response->json('data');
    }

    /**
     * Create a GCash source for payment
     */
    public function createGCashSource(int $amount, string $successUrl, string $failedUrl, array $billing = []): array
    {
        $response = Http::withBasicAuth($this->secretKey, '')
            ->post("{$this->baseUrl}/sources", [
                'data' => [
                    'attributes' => [
                        'amount' => $amount * 100,
                        'currency' => 'PHP',
                        'type' => 'gcash',
                        'redirect' => [
                            'success' => $successUrl,
                            'failed' => $failedUrl,
                        ],
                        'billing' => $billing,
                    ],
                ],
            ]);

        if ($response->failed()) {
            throw new \Exception('Failed to create GCash source');
        }

        return $response->json('data');
    }

    /**
     * Create a Maya/PayMaya source
     */
    public function createMayaSource(int $amount, string $successUrl, string $failedUrl, array $billing = []): array
    {
        $response = Http::withBasicAuth($this->secretKey, '')
            ->post("{$this->baseUrl}/sources", [
                'data' => [
                    'attributes' => [
                        'amount' => $amount * 100,
                        'currency' => 'PHP',
                        'type' => 'paymaya',
                        'redirect' => [
                            'success' => $successUrl,
                            'failed' => $failedUrl,
                        ],
                        'billing' => $billing,
                    ],
                ],
            ]);

        if ($response->failed()) {
            throw new \Exception('Failed to create Maya source');
        }

        return $response->json('data');
    }

    /**
     * Retrieve a payment intent
     */
    public function getPaymentIntent(string $paymentIntentId): array
    {
        $response = Http::withBasicAuth($this->secretKey, '')
            ->get("{$this->baseUrl}/payment_intents/{$paymentIntentId}");

        if ($response->failed()) {
            throw new \Exception('Failed to retrieve payment intent');
        }

        return $response->json('data');
    }

    /**
     * Retrieve a checkout session
     */
    public function getCheckoutSession(string $sessionId): array
    {
        $response = Http::withBasicAuth($this->secretKey, '')
            ->get("{$this->baseUrl}/checkout_sessions/{$sessionId}");

        if ($response->failed()) {
            throw new \Exception('Failed to retrieve checkout session');
        }

        return $response->json('data');
    }

    /**
     * Handle webhook event
     */
    public function handleWebhook(array $payload, string $signature): void
    {
        // Verify signature
        if (!$this->verifyWebhookSignature($payload, $signature)) {
            throw new \Exception('Invalid webhook signature');
        }

        $event = $payload['data']['attributes'];
        $type = $event['type'];
        $data = $event['data'];

        match ($type) {
            'payment.paid' => $this->handlePaymentPaid($data),
            'payment.failed' => $this->handlePaymentFailed($data),
            'checkout_session.payment.paid' => $this->handleCheckoutSessionPaid($data),
            default => Log::info("Unhandled PayMongo webhook: {$type}"),
        };
    }

    protected function handlePaymentPaid(array $data): void
    {
        $metadata = $data['attributes']['metadata'] ?? [];
        $orderId = $metadata['order_id'] ?? null;

        if (!$orderId) {
            Log::warning('Payment paid webhook missing order_id', $data);
            return;
        }

        $order = Order::find($orderId);
        if (!$order) {
            Log::warning('Order not found for payment', ['order_id' => $orderId]);
            return;
        }

        $amount = $data['attributes']['amount'] / 100;
        $fee = $data['attributes']['fee'] / 100;
        
        $order->recordPayment(
            $amount - $fee,
            $data['attributes']['source']['type'] ?? 'card',
            $data['id']
        );

        Log::info('Payment recorded via webhook', [
            'order_id' => $orderId,
            'amount' => $amount,
        ]);
    }

    protected function handlePaymentFailed(array $data): void
    {
        $metadata = $data['attributes']['metadata'] ?? [];
        $orderId = $metadata['order_id'] ?? null;

        if ($orderId) {
            Log::warning('Payment failed', [
                'order_id' => $orderId,
                'error' => $data['attributes']['last_payment_error'] ?? null,
            ]);
        }
    }

    protected function handleCheckoutSessionPaid(array $data): void
    {
        $metadata = $data['attributes']['metadata'] ?? [];
        $orderId = $metadata['order_id'] ?? null;

        if (!$orderId) {
            return;
        }

        $order = Order::find($orderId);
        if (!$order) {
            return;
        }

        $payments = $data['attributes']['payments'] ?? [];
        foreach ($payments as $payment) {
            $amount = $payment['attributes']['amount'] / 100;
            $fee = $payment['attributes']['fee'] / 100;
            
            $order->recordPayment(
                $amount - $fee,
                $payment['attributes']['source']['type'] ?? 'card',
                $payment['id']
            );
        }
    }

    protected function verifyWebhookSignature(array $payload, string $signature): bool
    {
        $webhookSecret = config('paymongo.webhook_secret');
        
        if (!$webhookSecret) {
            return true; // Skip verification in development
        }

        $computedSignature = hash_hmac('sha256', json_encode($payload), $webhookSecret);
        
        return hash_equals($computedSignature, $signature);
    }

    protected function formatOrderLineItems(Order $order): array
    {
        return $order->items->map(function ($item) {
            return [
                'name' => $item->name,
                'quantity' => (int) $item->quantity,
                'amount' => (int) ($item->unit_price * 100),
                'currency' => 'PHP',
                'description' => $item->description ?? '',
            ];
        })->toArray();
    }

    protected function getEnabledPaymentMethods(Tenant $tenant): array
    {
        $methods = [];
        
        if ($tenant->gcash_enabled) {
            $methods[] = 'gcash';
        }
        if ($tenant->maya_enabled) {
            $methods[] = 'paymaya';
        }
        if ($tenant->card_enabled) {
            $methods[] = 'card';
        }
        
        // Add GrabPay and DOB by default
        $methods[] = 'grab_pay';
        $methods[] = 'dob';

        return $methods;
    }

    /**
     * Calculate transaction fee for a given amount and method
     */
    public function calculateFee(float $amount, string $method): float
    {
        $config = config("paymongo.payment_methods.{$method}", []);
        
        $percentage = $config['fee_percentage'] ?? 2.5;
        $fixed = ($config['fee_fixed'] ?? 0) / 100; // Convert centavos to PHP

        return round(($amount * $percentage / 100) + $fixed, 2);
    }
}
