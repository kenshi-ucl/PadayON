<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->unsignedBigInteger('category_id')->nullable();
            $table->string('name');
            $table->string('name_tl')->nullable();
            $table->string('sku')->nullable();
            $table->string('barcode')->nullable();
            $table->text('description')->nullable();
            
            // Pricing
            $table->decimal('cost_price', 10, 2)->default(0);
            $table->decimal('selling_price', 10, 2);
            $table->decimal('wholesale_price', 10, 2)->nullable();
            $table->decimal('compare_price', 10, 2)->nullable(); // Original price for discounts
            
            // Tax
            $table->boolean('is_taxable')->default(true);
            $table->decimal('tax_rate', 5, 2)->nullable();
            
            // Inventory
            $table->integer('stock_quantity')->default(0);
            $table->integer('low_stock_threshold')->default(10);
            $table->string('stock_unit')->default('piece'); // piece, kg, liter, pack, bundle
            $table->decimal('unit_weight', 8, 3)->nullable(); // For weight-based pricing
            $table->boolean('track_inventory')->default(true);
            $table->boolean('allow_backorder')->default(false);
            
            // Tingi/Retail Settings (for sari-sari)
            $table->boolean('allow_tingi')->default(false);
            $table->integer('pieces_per_pack')->nullable();
            $table->decimal('tingi_price', 10, 2)->nullable();
            
            // Images
            $table->string('image')->nullable();
            $table->json('gallery')->nullable();
            
            // Status
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->integer('sort_order')->default(0);
            
            // E-loading specific
            $table->boolean('is_eload')->default(false);
            $table->string('eload_network')->nullable();
            $table->string('eload_type')->nullable();
            
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');

            $table->foreign('category_id')
                ->references('id')
                ->on('categories')
                ->onDelete('set null');

            $table->index(['tenant_id', 'is_active']);
            $table->index(['tenant_id', 'barcode']);
            $table->index(['tenant_id', 'sku']);
            $table->index(['tenant_id', 'stock_quantity']);
            $table->index(['tenant_id', 'category_id']);
        });

        // Stock movement history
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('type'); // purchase, sale, adjustment, transfer, return, damage
            $table->integer('quantity'); // Positive for in, negative for out
            $table->integer('stock_before');
            $table->integer('stock_after');
            $table->decimal('unit_cost', 10, 2)->nullable();
            $table->string('reference_type')->nullable(); // Order, PurchaseOrder, etc.
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');

            $table->foreign('product_id')
                ->references('id')
                ->on('products')
                ->onDelete('cascade');

            $table->index(['tenant_id', 'product_id']);
            $table->index(['tenant_id', 'type']);
            $table->index(['tenant_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('products');
    }
};
