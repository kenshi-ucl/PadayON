<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('qr_token', 64)->nullable()->unique()->after('barcode');
        });

        // Generate QR tokens for existing products
        $products = \App\Models\Product::whereNull('qr_token')->get();
        foreach ($products as $product) {
            $product->qr_token = Str::uuid()->toString();
            $product->save();
        }
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('qr_token');
        });
    }
};
