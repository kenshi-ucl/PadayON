<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->string('tenant_id')->nullable()->after('id');
            $table->unsignedBigInteger('sender_id')->nullable()->after('tenant_id');
            $table->string('title')->nullable()->after('type');
            $table->string('notification_type')->default('announcement')->after('title'); // announcement, alert, task
            $table->string('priority')->default('normal')->after('notification_type'); // low, normal, high

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('sender_id')->references('id')->on('users')->onDelete('set null');

            $table->index('tenant_id');
            $table->index('sender_id');
            $table->index('notification_type');
            $table->index('read_at');
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropForeign(['sender_id']);
            $table->dropIndex(['tenant_id']);
            $table->dropIndex(['sender_id']);
            $table->dropIndex(['notification_type']);
            $table->dropIndex(['read_at']);
            $table->dropColumn(['tenant_id', 'sender_id', 'title', 'notification_type', 'priority']);
        });
    }
};
