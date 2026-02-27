<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PayMongoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function paymongo(Request $request, PayMongoService $payMongoService)
    {
        $payload = $request->all();
        $signature = $request->header('PayMongo-Signature');

        Log::info('PayMongo webhook received', [
            'type' => $payload['data']['attributes']['type'] ?? 'unknown',
        ]);

        try {
            $payMongoService->handleWebhook($payload, $signature);
            return response()->json(['received' => true]);
        } catch (\Exception $e) {
            Log::error('PayMongo webhook error', [
                'error' => $e->getMessage(),
            ]);
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function dragonpay(Request $request)
    {
        $txnId = $request->get('txnid');
        $status = $request->get('status');
        $refNo = $request->get('refno');
        $message = $request->get('message');
        $digest = $request->get('digest');

        Log::info('DragonPay webhook received', [
            'txnid' => $txnId,
            'status' => $status,
            'refno' => $refNo,
        ]);

        // Verify digest
        $password = config('services.dragonpay.password');
        $expectedDigest = sha1("{$txnId}:{$refNo}:{$status}:{$message}:{$password}");

        if ($digest !== $expectedDigest) {
            Log::warning('DragonPay invalid digest');
            return response('Invalid digest', 400);
        }

        // Handle status
        switch ($status) {
            case 'S': // Success
                // Process successful payment
                break;
            case 'F': // Failed
                // Handle failed payment
                break;
            case 'P': // Pending
                // Payment is pending
                break;
        }

        return response('OK');
    }

    public function semaphore(Request $request)
    {
        Log::info('Semaphore webhook received', $request->all());

        // Handle delivery report
        $messageId = $request->get('message_id');
        $status = $request->get('status');

        if ($messageId && $status) {
            \App\Models\SmsMessage::where('provider_id', $messageId)
                ->update([
                    'status' => $status === 'Delivered' ? 'delivered' : 'failed',
                    'delivered_at' => $status === 'Delivered' ? now() : null,
                ]);
        }

        return response()->json(['received' => true]);
    }
}
