<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->unsignedBigInteger('order_id')->nullable();
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('payment_number')->unique();
            
            // Type
            $table->string('type')->default('order'); // order, credit_payment, deposit, refund
            
            // Amount
            $table->decimal('amount', 12, 2);
            $table->decimal('fee', 10, 2)->default(0); // Gateway fee
            $table->decimal('net_amount', 12, 2);
            $table->string('currency')->default('PHP');
            
            // Method
            $table->string('method'); // cash, gcash, maya, card, bank_transfer, cod, otc
            $table->string('channel')->nullable(); // e.g., 7-eleven, bpi
            
            // Gateway Info
            $table->string('gateway')->nullable(); // paymongo, dragonpay, manual
            $table->string('gateway_id')->nullable(); // Gateway transaction ID
            $table->string('gateway_status')->nullable();
            $table->json('gateway_response')->nullable();
            
            // Status
            $table->string('status')->default('pending'); // pending, processing, completed, failed, refunded
            
            // For COD
            $table->boolean('is_cod')->default(false);
            $table->timestamp('cod_collected_at')->nullable();
            $table->string('cod_collector')->nullable();
            
            // Reference
            $table->string('reference_number')->nullable();
            $table->text('notes')->nullable();
            
            // Timestamps
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');

            $table->foreign('order_id')
                ->references('id')
                ->on('orders')
                ->onDelete('set null');

            $table->foreign('customer_id')
                ->references('id')
                ->on('customers')
                ->onDelete('set null');

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('set null');

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'method']);
            $table->index(['tenant_id', 'created_at']);
            $table->index(['tenant_id', 'order_id']);
            $table->index(['tenant_id', 'customer_id']);
            $table->index('gateway_id');
        });

        // Credit payments (for Utang tracking)
        Schema::create('credit_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('order_id')->nullable();
            $table->unsignedBigInteger('payment_id')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            
            $table->string('type'); // credit, payment
            $table->decimal('amount', 12, 2);
            $table->decimal('balance_before', 12, 2);
            $table->decimal('balance_after', 12, 2);
            $table->text('description')->nullable();
            $table->text('notes')->nullable();
            
            $table->timestamps();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');

            $table->foreign('customer_id')
                ->references('id')
                ->on('customers')
                ->onDelete('cascade');

            $table->foreign('order_id')
                ->references('id')
                ->on('orders')
                ->onDelete('set null');

            $table->foreign('payment_id')
                ->references('id')
                ->on('payments')
                ->onDelete('set null');

            $table->index(['tenant_id', 'customer_id']);
            $table->index(['tenant_id', 'type']);
            $table->index(['tenant_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('credit_transactions');
        Schema::dropIfExists('payments');
    }
};
