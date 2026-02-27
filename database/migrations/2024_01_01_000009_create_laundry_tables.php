<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Laundry services/pricing
        Schema::create('laundry_services', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('name');
            $table->string('name_tl')->nullable();
            $table->text('description')->nullable();
            $table->string('pricing_type')->default('weight'); // weight, piece, flat
            $table->decimal('price', 10, 2);
            $table->string('unit')->default('kg');
            $table->decimal('min_weight', 8, 2)->nullable();
            $table->integer('estimated_hours')->default(24);
            $table->boolean('express_available')->default(true);
            $table->decimal('express_multiplier', 4, 2)->default(1.5);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');

            $table->index(['tenant_id', 'is_active']);
        });

        // Laundry orders
        Schema::create('laundry_orders', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('laundry_service_id')->nullable();
            $table->unsignedBigInteger('assigned_to')->nullable(); // Staff assigned
            
            // Job details
            $table->string('job_number')->unique();
            $table->string('service_type'); // wash_dry_fold, wash_only, dry_only, iron_only, dry_clean
            $table->boolean('is_express')->default(false);
            $table->boolean('is_rush')->default(false);
            
            // Weight/Quantity
            $table->decimal('weight', 8, 2)->nullable();
            $table->integer('piece_count')->nullable();
            $table->decimal('price_per_unit', 10, 2);
            
            // Status workflow
            $table->string('status')->default('pending');
            $table->timestamp('received_at')->nullable();
            $table->timestamp('washing_started_at')->nullable();
            $table->timestamp('washing_completed_at')->nullable();
            $table->timestamp('drying_started_at')->nullable();
            $table->timestamp('drying_completed_at')->nullable();
            $table->timestamp('folding_started_at')->nullable();
            $table->timestamp('ready_at')->nullable();
            $table->timestamp('picked_up_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            
            // Pickup/Delivery
            $table->boolean('pickup_requested')->default(false);
            $table->boolean('delivery_requested')->default(false);
            $table->datetime('pickup_datetime')->nullable();
            $table->datetime('delivery_datetime')->nullable();
            $table->text('pickup_address')->nullable();
            $table->text('delivery_address')->nullable();
            
            // Estimated completion
            $table->datetime('estimated_completion')->nullable();
            
            // Special instructions
            $table->text('special_instructions')->nullable();
            $table->text('internal_notes')->nullable();
            
            // Claim info
            $table->string('claim_stub')->nullable();
            
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

            $table->foreign('laundry_service_id')
                ->references('id')
                ->on('laundry_services')
                ->onDelete('set null');

            $table->foreign('assigned_to')
                ->references('id')
                ->on('users')
                ->onDelete('set null');

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'job_number']);
            $table->index(['tenant_id', 'created_at']);
        });

        // Laundry items (garments in order)
        Schema::create('laundry_items', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->unsignedBigInteger('laundry_order_id');
            $table->string('garment_type');
            $table->integer('quantity')->default(1);
            $table->string('color')->nullable();
            $table->string('brand')->nullable();
            $table->text('condition_notes')->nullable(); // Pre-existing damage
            $table->string('special_care')->nullable();
            $table->string('image')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');

            $table->foreign('laundry_order_id')
                ->references('id')
                ->on('laundry_orders')
                ->onDelete('cascade');

            $table->index(['tenant_id', 'laundry_order_id']);
        });

        // Laundry status history
        Schema::create('laundry_status_history', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->unsignedBigInteger('laundry_order_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('status');
            $table->string('previous_status')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');

            $table->foreign('laundry_order_id')
                ->references('id')
                ->on('laundry_orders')
                ->onDelete('cascade');

            $table->index(['tenant_id', 'laundry_order_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('laundry_status_history');
        Schema::dropIfExists('laundry_items');
        Schema::dropIfExists('laundry_orders');
        Schema::dropIfExists('laundry_services');
    }
};
