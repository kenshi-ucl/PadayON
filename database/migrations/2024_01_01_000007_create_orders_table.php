<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->unsignedBigInteger('user_id')->nullable(); // Staff who processed
            $table->string('order_number')->unique();
            $table->string('type')->default('pos'); // pos, online, phone, catering, laundry
            
            // Status
            $table->string('status')->default('pending');
            $table->string('payment_status')->default('unpaid'); // unpaid, partial, paid, refunded
            $table->string('fulfillment_status')->default('unfulfilled'); // unfulfilled, processing, fulfilled, delivered
            
            // Amounts
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->string('discount_type')->nullable(); // percentage, fixed
            $table->decimal('discount_value', 10, 2)->nullable();
            $table->string('discount_reason')->nullable();
            $table->decimal('tax_amount', 10, 2)->default(0);
            $table->decimal('delivery_fee', 10, 2)->default(0);
            $table->decimal('service_fee', 10, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->decimal('amount_paid', 12, 2)->default(0);
            $table->decimal('change_amount', 10, 2)->default(0);
            $table->decimal('balance_due', 12, 2)->default(0);
            
            // Credit/Utang
            $table->boolean('is_credit')->default(false);
            $table->date('credit_due_date')->nullable();
            
            // Payment Info
            $table->string('payment_method')->nullable(); // cash, gcash, maya, card, cod, credit
            $table->string('payment_reference')->nullable();
            $table->timestamp('paid_at')->nullable();
            
            // Delivery Info
            $table->boolean('is_delivery')->default(false);
            $table->text('delivery_address')->nullable();
            $table->string('delivery_barangay')->nullable();
            $table->string('delivery_city')->nullable();
            $table->decimal('delivery_lat', 10, 8)->nullable();
            $table->decimal('delivery_lng', 11, 8)->nullable();
            $table->string('delivery_slot')->nullable();
            $table->date('delivery_date')->nullable();
            $table->string('delivery_status')->nullable();
            $table->string('tracking_number')->nullable();
            
            // Customer Info (for walk-in)
            $table->string('customer_name')->nullable();
            $table->string('customer_phone')->nullable();
            $table->string('customer_email')->nullable();
            
            // Notes
            $table->text('notes')->nullable();
            $table->text('internal_notes')->nullable();
            
            // Source
            $table->string('source')->default('pos'); // pos, website, app, phone
            $table->string('device')->nullable();
            
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');

            $table->foreign('customer_id')
                ->references('id')
                ->on('customers')
                ->onDelete('set null');

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('set null');

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'payment_status']);
            $table->index(['tenant_id', 'type']);
            $table->index(['tenant_id', 'created_at']);
            $table->index(['tenant_id', 'customer_id']);
            $table->index(['tenant_id', 'is_credit']);
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('product_id')->nullable();
            $table->string('name');
            $table->string('sku')->nullable();
            $table->text('description')->nullable();
            $table->decimal('unit_price', 10, 2);
            $table->decimal('cost_price', 10, 2)->default(0);
            $table->decimal('quantity', 10, 3)->default(1);
            $table->string('unit')->default('piece');
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('tax_amount', 10, 2)->default(0);
            $table->decimal('total', 12, 2);
            $table->text('notes')->nullable();
            $table->json('options')->nullable(); // For variants/customizations
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');

            $table->foreign('order_id')
                ->references('id')
                ->on('orders')
                ->onDelete('cascade');

            $table->foreign('product_id')
                ->references('id')
                ->on('products')
                ->onDelete('set null');

            $table->index(['tenant_id', 'order_id']);
            $table->index(['tenant_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
