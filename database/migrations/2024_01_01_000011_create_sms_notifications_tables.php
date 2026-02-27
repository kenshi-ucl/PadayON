<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // SMS Messages
        Schema::create('sms_messages', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();

            $table->string('to'); // Phone number
            $table->string('from')->nullable();
            $table->text('message');
            $table->string('type')->default('transactional'); // transactional, marketing, reminder
            $table->string('template')->nullable();

            // Gateway info
            $table->string('provider')->default('semaphore');
            $table->string('provider_id')->nullable();
            $table->string('status')->default('pending'); // pending, sent, delivered, failed
            $table->text('error_message')->nullable();

            // Cost tracking
            $table->decimal('cost', 8, 2)->default(0.50);
            $table->integer('segments')->default(1);

            $table->timestamp('sent_at')->nullable();
            $table->timestamp('delivered_at')->nullable();

            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'type']);
            $table->index(['tenant_id', 'created_at']);
            $table->index(['tenant_id', 'customer_id']);
        });

        // SMS Templates
        Schema::create('sms_templates', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('name');
            $table->string('slug');
            $table->string('type'); // order_confirmation, payment_reminder, credit_reminder, laundry_ready, etc.
            $table->text('content');
            $table->json('variables')->nullable(); // Available placeholders
            $table->boolean('is_active')->default(true);
            $table->boolean('is_system')->default(false);
            $table->timestamps();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');

            $table->unique(['tenant_id', 'slug']);
            $table->index(['tenant_id', 'type']);
        });

        // Notifications
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        // Activity log (using spatie/laravel-activitylog)
        Schema::create('activity_log', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->nullable();
            $table->string('log_name')->nullable();
            $table->text('description');
            $table->nullableMorphs('subject', 'subject');
            $table->string('event')->nullable();
            $table->nullableMorphs('causer', 'causer');
            $table->json('properties')->nullable();
            $table->uuid('batch_uuid')->nullable();
            $table->timestamps();

            $table->index('log_name');
            $table->index(['tenant_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_log');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('sms_templates');
        Schema::dropIfExists('sms_messages');
    }
};
