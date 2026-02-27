<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Website settings per tenant
        Schema::create('websites', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->unique();
            $table->string('template')->default('minimal');
            $table->boolean('is_published')->default(false);
            
            // Branding
            $table->string('logo')->nullable();
            $table->string('favicon')->nullable();
            $table->string('primary_color')->default('#3B82F6');
            $table->string('secondary_color')->default('#10B981');
            $table->string('accent_color')->default('#F59E0B');
            
            // Content
            $table->string('tagline')->nullable();
            $table->text('about')->nullable();
            $table->json('social_links')->nullable();
            $table->json('business_hours')->nullable();
            
            // SEO
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->string('meta_image')->nullable();
            $table->json('meta_keywords')->nullable();
            
            // Analytics
            $table->string('google_analytics_id')->nullable();
            $table->string('facebook_pixel_id')->nullable();
            
            // Custom code
            $table->text('custom_css')->nullable();
            $table->text('custom_js')->nullable();
            $table->text('head_code')->nullable();
            $table->text('body_code')->nullable();
            
            $table->json('settings')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');
        });

        // Pages
        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('title');
            $table->string('slug');
            $table->text('excerpt')->nullable();
            $table->longText('content')->nullable();
            $table->longText('gjs_data')->nullable(); // GrapesJS data
            $table->longText('html')->nullable(); // Rendered HTML
            $table->longText('css')->nullable(); // Custom CSS
            
            // SEO
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->string('featured_image')->nullable();
            
            // Status
            $table->boolean('is_published')->default(false);
            $table->boolean('is_homepage')->default(false);
            $table->boolean('show_in_nav')->default(true);
            $table->integer('sort_order')->default(0);
            
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');

            $table->unique(['tenant_id', 'slug']);
            $table->index(['tenant_id', 'is_published']);
        });

        // Subscriptions
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('plan');
            $table->string('status')->default('active'); // active, cancelled, past_due, paused
            
            // Billing
            $table->decimal('price', 10, 2);
            $table->string('currency')->default('PHP');
            $table->string('billing_period')->default('monthly');
            
            // Dates
            $table->timestamp('starts_at');
            $table->timestamp('ends_at')->nullable();
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('paused_at')->nullable();
            
            // Payment
            $table->string('payment_method')->nullable();
            $table->string('paymongo_subscription_id')->nullable();
            
            $table->json('features')->nullable(); // Snapshot of features at subscription time
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');

            $table->index(['tenant_id', 'status']);
        });

        // Subscription invoices
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->unsignedBigInteger('subscription_id')->nullable();
            $table->string('invoice_number')->unique();
            
            $table->decimal('subtotal', 12, 2);
            $table->decimal('tax', 10, 2)->default(0);
            $table->decimal('total', 12, 2);
            $table->string('currency')->default('PHP');
            
            $table->string('status')->default('pending'); // pending, paid, failed, refunded
            $table->date('due_date');
            $table->timestamp('paid_at')->nullable();
            
            $table->string('payment_method')->nullable();
            $table->string('payment_reference')->nullable();
            
            $table->json('line_items')->nullable();
            $table->text('notes')->nullable();
            
            $table->timestamps();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');

            $table->foreign('subscription_id')
                ->references('id')
                ->on('subscriptions')
                ->onDelete('set null');

            $table->index(['tenant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('pages');
        Schema::dropIfExists('websites');
    }
};
