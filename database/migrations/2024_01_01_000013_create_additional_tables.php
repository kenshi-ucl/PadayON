<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // E-Loading transactions
        Schema::create('eload_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('transaction_number')->unique();
            
            // Mobile details
            $table->string('mobile_number');
            $table->string('network'); // globe, smart, dito
            $table->string('product_code');
            $table->string('product_name');
            
            // Amounts
            $table->decimal('amount', 10, 2);
            $table->decimal('cost', 10, 2);
            $table->decimal('profit', 10, 2);
            
            // Status
            $table->string('status')->default('pending'); // pending, processing, success, failed
            $table->string('provider_reference')->nullable();
            $table->text('error_message')->nullable();
            
            $table->timestamp('processed_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'created_at']);
        });

        // Bills payment transactions
        Schema::create('bills_payments', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('transaction_number')->unique();
            
            // Biller details
            $table->string('biller_code');
            $table->string('biller_name');
            $table->string('category'); // electric, water, internet, insurance
            $table->string('account_number');
            $table->string('account_name')->nullable();
            
            // Amounts
            $table->decimal('amount', 12, 2);
            $table->decimal('convenience_fee', 10, 2)->default(0);
            $table->decimal('total', 12, 2);
            
            // Status
            $table->string('status')->default('pending');
            $table->string('provider_reference')->nullable();
            $table->text('error_message')->nullable();
            
            $table->timestamp('processed_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'category']);
        });

        // Daily reports (pre-computed for performance)
        Schema::create('daily_reports', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->date('report_date');
            
            // Sales
            $table->integer('total_orders')->default(0);
            $table->decimal('gross_sales', 14, 2)->default(0);
            $table->decimal('discounts', 12, 2)->default(0);
            $table->decimal('taxes', 12, 2)->default(0);
            $table->decimal('net_sales', 14, 2)->default(0);
            
            // Payments
            $table->decimal('cash_collected', 14, 2)->default(0);
            $table->decimal('gcash_collected', 14, 2)->default(0);
            $table->decimal('maya_collected', 14, 2)->default(0);
            $table->decimal('card_collected', 14, 2)->default(0);
            $table->decimal('credit_sales', 14, 2)->default(0);
            $table->decimal('credit_collected', 14, 2)->default(0);
            
            // E-loading
            $table->integer('eload_transactions')->default(0);
            $table->decimal('eload_sales', 12, 2)->default(0);
            $table->decimal('eload_profit', 12, 2)->default(0);
            
            // Bills payment
            $table->integer('bills_transactions')->default(0);
            $table->decimal('bills_amount', 14, 2)->default(0);
            
            // Inventory
            $table->integer('items_sold')->default(0);
            $table->decimal('cost_of_goods', 14, 2)->default(0);
            $table->decimal('gross_profit', 14, 2)->default(0);
            
            // Customers
            $table->integer('new_customers')->default(0);
            $table->integer('returning_customers')->default(0);
            
            // Laundry specific
            $table->integer('laundry_jobs')->default(0);
            $table->decimal('laundry_weight', 10, 2)->default(0);
            
            // Catering specific
            $table->integer('catering_events')->default(0);
            $table->integer('catering_guests')->default(0);
            
            $table->json('top_products')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');

            $table->unique(['tenant_id', 'report_date']);
            $table->index(['tenant_id', 'report_date']);
        });

        // Cash drawer/register
        Schema::create('cash_registers', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->unsignedBigInteger('user_id');
            $table->date('register_date');
            
            // Opening
            $table->decimal('opening_balance', 12, 2);
            $table->timestamp('opened_at');
            
            // Transactions during shift
            $table->decimal('cash_sales', 12, 2)->default(0);
            $table->decimal('cash_refunds', 12, 2)->default(0);
            $table->decimal('cash_in', 12, 2)->default(0); // Additional cash added
            $table->decimal('cash_out', 12, 2)->default(0); // Cash removed
            
            // Closing
            $table->decimal('expected_balance', 12, 2)->nullable();
            $table->decimal('actual_balance', 12, 2)->nullable();
            $table->decimal('difference', 12, 2)->nullable();
            $table->timestamp('closed_at')->nullable();
            
            $table->text('notes')->nullable();
            $table->string('status')->default('open'); // open, closed
            
            $table->timestamps();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'register_date']);
        });

        // Permissions table for spatie/laravel-permission
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('guard_name');
            $table->timestamps();

            $table->unique(['name', 'guard_name']);
        });

        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->nullable();
            $table->string('name');
            $table->string('guard_name');
            $table->timestamps();

            $table->unique(['tenant_id', 'name', 'guard_name']);
        });

        Schema::create('model_has_permissions', function (Blueprint $table) {
            $table->unsignedBigInteger('permission_id');
            $table->string('model_type');
            $table->unsignedBigInteger('model_id');
            $table->primary(['permission_id', 'model_id', 'model_type']);
        });

        Schema::create('model_has_roles', function (Blueprint $table) {
            $table->unsignedBigInteger('role_id');
            $table->string('model_type');
            $table->unsignedBigInteger('model_id');
            $table->primary(['role_id', 'model_id', 'model_type']);
        });

        Schema::create('role_has_permissions', function (Blueprint $table) {
            $table->unsignedBigInteger('permission_id');
            $table->unsignedBigInteger('role_id');
            $table->primary(['permission_id', 'role_id']);
        });

        // Media library table (spatie/laravel-medialibrary)
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->morphs('model');
            $table->uuid('uuid')->nullable()->unique();
            $table->string('collection_name');
            $table->string('name');
            $table->string('file_name');
            $table->string('mime_type')->nullable();
            $table->string('disk');
            $table->string('conversions_disk')->nullable();
            $table->unsignedBigInteger('size');
            $table->json('manipulations');
            $table->json('custom_properties');
            $table->json('generated_conversions');
            $table->json('responsive_images');
            $table->unsignedInteger('order_column')->nullable()->index();
            $table->nullableTimestamps();
        });

        // Jobs table for queues
        Schema::create('jobs', function (Blueprint $table) {
            $table->id();
            $table->string('queue')->index();
            $table->longText('payload');
            $table->unsignedTinyInteger('attempts');
            $table->unsignedInteger('reserved_at')->nullable();
            $table->unsignedInteger('available_at');
            $table->unsignedInteger('created_at');
        });

        Schema::create('job_batches', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->integer('total_jobs');
            $table->integer('pending_jobs');
            $table->integer('failed_jobs');
            $table->longText('failed_job_ids');
            $table->mediumText('options')->nullable();
            $table->integer('cancelled_at')->nullable();
            $table->integer('created_at');
            $table->integer('finished_at')->nullable();
        });

        Schema::create('failed_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('uuid')->unique();
            $table->text('connection');
            $table->text('queue');
            $table->longText('payload');
            $table->longText('exception');
            $table->timestamp('failed_at')->useCurrent();
        });

        // Cache table
        Schema::create('cache', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration');
        });

        Schema::create('cache_locks', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('owner');
            $table->integer('expiration');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cache_locks');
        Schema::dropIfExists('cache');
        Schema::dropIfExists('failed_jobs');
        Schema::dropIfExists('job_batches');
        Schema::dropIfExists('jobs');
        Schema::dropIfExists('media');
        Schema::dropIfExists('role_has_permissions');
        Schema::dropIfExists('model_has_roles');
        Schema::dropIfExists('model_has_permissions');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('cash_registers');
        Schema::dropIfExists('daily_reports');
        Schema::dropIfExists('bills_payments');
        Schema::dropIfExists('eload_transactions');
    }
};
