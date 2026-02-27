<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('barangay')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            
            // Credit/Utang Settings (for Sari-Sari)
            $table->decimal('credit_limit', 10, 2)->default(500);
            $table->decimal('current_balance', 10, 2)->default(0);
            $table->boolean('credit_enabled')->default(true);
            $table->date('last_credit_date')->nullable();
            $table->date('last_payment_date')->nullable();
            
            // Stats
            $table->integer('total_orders')->default(0);
            $table->decimal('total_spent', 12, 2)->default(0);
            $table->integer('loyalty_points')->default(0);
            
            // Status
            $table->boolean('is_active')->default(true);
            $table->boolean('is_suki')->default(false); // Loyal customer
            
            $table->text('notes')->nullable();
            $table->json('metadata')->nullable();
            
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');

            $table->index(['tenant_id', 'is_active']);
            $table->index(['tenant_id', 'phone']);
            $table->index(['tenant_id', 'current_balance']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
