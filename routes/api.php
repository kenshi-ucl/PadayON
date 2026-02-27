<?php

use App\Http\Controllers\Api\WebhookController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Webhooks (no auth)
Route::prefix('webhooks')->group(function () {
    Route::post('/paymongo', [WebhookController::class, 'paymongo']);
    Route::post('/dragonpay', [WebhookController::class, 'dragonpay']);
    Route::post('/semaphore', [WebhookController::class, 'semaphore']);
});

// Health check
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
        'version' => '1.0.0',
    ]);
});
