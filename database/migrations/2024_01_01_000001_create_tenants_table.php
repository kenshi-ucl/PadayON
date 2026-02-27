<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('business_type'); // sari_sari, laundry, catering, general_service
            $table->string('plan')->default('free');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->string('logo')->nullable();
            $table->string('timezone')->default('Asia/Manila');
            $table->string('currency')->default('PHP');
            $table->string('locale')->default('en');
            
            // Business Information
            $table->string('business_name')->nullable();
            $table->text('business_address')->nullable();
            $table->string('city')->nullable();
            $table->string('province')->nullable();
            $table->string('region')->nullable();
            $table->string('postal_code')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            
            // Registration Details
            $table->string('dti_registration')->nullable();
            $table->string('bir_tin')->nullable();
            $table->string('sec_registration')->nullable();
            $table->string('mayors_permit')->nullable();
            
            // Payment Settings
            $table->string('paymongo_account_id')->nullable();
            $table->boolean('gcash_enabled')->default(true);
            $table->boolean('maya_enabled')->default(true);
            $table->boolean('card_enabled')->default(true);
            $table->boolean('cod_enabled')->default(true);
            
            // Subscription
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('subscription_ends_at')->nullable();
            $table->boolean('is_active')->default(true);
            
            // Settings (JSON)
            $table->json('settings')->nullable();
            $table->json('features')->nullable();
            $table->json('data')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('business_type');
            $table->index('plan');
            $table->index('is_active');
            $table->index('region');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
