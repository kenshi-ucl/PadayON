<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Menu items for catering
        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->unsignedBigInteger('category_id')->nullable();
            $table->string('name');
            $table->string('name_tl')->nullable();
            $table->text('description')->nullable();
            
            // Pricing
            $table->string('pricing_type')->default('per_head'); // per_head, per_tray, per_order
            $table->decimal('price', 10, 2);
            $table->decimal('cost', 10, 2)->default(0);
            $table->integer('serves')->nullable(); // How many people per serving/tray
            
            // Tray sizes
            $table->json('tray_sizes')->nullable(); // [{size: 'small', serves: 10, price: 500}, ...]
            
            // Recipe/Ingredients
            $table->json('ingredients')->nullable();
            $table->text('recipe_notes')->nullable();
            $table->integer('prep_time_minutes')->nullable();
            $table->integer('cook_time_minutes')->nullable();
            
            // Dietary info
            $table->boolean('is_vegetarian')->default(false);
            $table->boolean('is_halal')->default(false);
            $table->boolean('is_gluten_free')->default(false);
            $table->json('allergens')->nullable();
            
            // Media
            $table->string('image')->nullable();
            $table->json('gallery')->nullable();
            
            // Status
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_available')->default(true);
            $table->integer('sort_order')->default(0);
            
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
            $table->index(['tenant_id', 'category_id']);
        });

        // Catering packages
        Schema::create('catering_packages', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('name');
            $table->string('name_tl')->nullable();
            $table->text('description')->nullable();
            $table->string('type')->default('buffet'); // buffet, plated, food_station, cocktail, boodle
            
            // Pricing
            $table->decimal('price_per_head', 10, 2);
            $table->integer('min_guests')->default(30);
            $table->integer('max_guests')->nullable();
            
            // What's included
            $table->json('included_items')->nullable(); // Menu item IDs
            $table->integer('appetizer_choices')->default(2);
            $table->integer('main_choices')->default(3);
            $table->integer('dessert_choices')->default(1);
            $table->integer('beverage_choices')->default(2);
            
            // Package includes
            $table->boolean('includes_setup')->default(true);
            $table->boolean('includes_cleanup')->default(true);
            $table->boolean('includes_utensils')->default(true);
            $table->boolean('includes_linens')->default(false);
            $table->integer('service_crew_count')->default(2);
            $table->integer('service_hours')->default(4);
            
            // Extra fees
            $table->decimal('extra_hour_fee', 10, 2)->default(500);
            $table->decimal('extra_crew_fee', 10, 2)->default(500);
            
            // Media
            $table->string('image')->nullable();
            $table->json('gallery')->nullable();
            
            // Status
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->integer('sort_order')->default(0);
            
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');

            $table->index(['tenant_id', 'is_active']);
            $table->index(['tenant_id', 'type']);
        });

        // Catering events/bookings
        Schema::create('catering_events', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->unsignedBigInteger('package_id')->nullable();
            
            // Event details
            $table->string('event_number')->unique();
            $table->string('event_name');
            $table->string('event_type')->nullable(); // wedding, birthday, corporate, debut, etc.
            $table->date('event_date');
            $table->time('event_time');
            $table->time('end_time')->nullable();
            $table->integer('guest_count');
            
            // Venue
            $table->string('venue_name');
            $table->text('venue_address');
            $table->string('venue_city')->nullable();
            $table->decimal('venue_lat', 10, 8)->nullable();
            $table->decimal('venue_lng', 11, 8)->nullable();
            $table->text('venue_notes')->nullable();
            
            // Service type
            $table->string('service_type')->default('buffet');
            $table->boolean('includes_setup')->default(true);
            $table->boolean('includes_cleanup')->default(true);
            $table->integer('service_crew')->default(2);
            $table->integer('service_hours')->default(4);
            
            // Timing
            $table->time('setup_time')->nullable();
            $table->time('serving_time')->nullable();
            
            // Contact
            $table->string('contact_name');
            $table->string('contact_phone');
            $table->string('contact_email')->nullable();
            
            // Status
            $table->string('status')->default('inquiry'); // inquiry, quoted, confirmed, preparing, in_progress, completed, cancelled
            
            // Special requirements
            $table->text('special_requests')->nullable();
            $table->text('dietary_requirements')->nullable();
            $table->text('internal_notes')->nullable();
            
            // Kitchen production
            $table->boolean('kitchen_briefed')->default(false);
            $table->timestamp('briefed_at')->nullable();
            
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
                ->onDelete('cascade');

            $table->foreign('customer_id')
                ->references('id')
                ->on('customers')
                ->onDelete('set null');

            $table->foreign('package_id')
                ->references('id')
                ->on('catering_packages')
                ->onDelete('set null');

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'event_date']);
            $table->index(['tenant_id', 'created_at']);
        });

        // Selected menu items for event
        Schema::create('catering_event_items', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->unsignedBigInteger('catering_event_id');
            $table->unsignedBigInteger('menu_item_id')->nullable();
            $table->string('name');
            $table->string('category')->nullable();
            $table->decimal('quantity', 8, 2)->default(1);
            $table->string('unit')->default('tray');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total', 12, 2);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');

            $table->foreign('catering_event_id')
                ->references('id')
                ->on('catering_events')
                ->onDelete('cascade');

            $table->foreign('menu_item_id')
                ->references('id')
                ->on('menu_items')
                ->onDelete('set null');

            $table->index(['tenant_id', 'catering_event_id']);
        });

        // Equipment rentals for event
        Schema::create('catering_equipment', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('rental_price', 10, 2);
            $table->integer('quantity_available')->default(10);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');
        });

        Schema::create('catering_event_equipment', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->unsignedBigInteger('catering_event_id');
            $table->unsignedBigInteger('equipment_id')->nullable();
            $table->string('name');
            $table->integer('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total', 12, 2);
            $table->timestamps();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');

            $table->foreign('catering_event_id')
                ->references('id')
                ->on('catering_events')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catering_event_equipment');
        Schema::dropIfExists('catering_equipment');
        Schema::dropIfExists('catering_event_items');
        Schema::dropIfExists('catering_events');
        Schema::dropIfExists('catering_packages');
        Schema::dropIfExists('menu_items');
    }
};
