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
        Schema::table('wishlist_claims', function (Blueprint $table) {
            // When the claimer marked it bought. Hidden from the list's owner.
            $table->timestamp('purchased_at')->nullable()->after('claimed_at');
            // When someone last nudged the claimer about an unbought claim (limited to every 3 days).
            $table->timestamp('nudged_at')->nullable()->after('purchased_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wishlist_claims', function (Blueprint $table) {
            $table->dropColumn(['purchased_at', 'nudged_at']);
        });
    }
};
