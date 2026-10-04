<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('wishlist_items', function (Blueprint $table) {
            // When the owner marked it "Got it": hidden from every list, kept as history.
            $table->timestamp('received_at')->nullable()->after('quantity');
        });

        Schema::table('wishlist_claims', function (Blueprint $table) {
            // When the claim was made, shown to fellow shoppers so they can judge whether to
            // nudge the claimer. Claims never lapse on their own.
            $table->timestamp('claimed_at')->nullable()->after('quantity');
        });

        DB::table('wishlist_claims')->update(['claimed_at' => DB::raw('created_at')]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wishlist_claims', function (Blueprint $table) {
            $table->dropColumn('claimed_at');
        });

        Schema::table('wishlist_items', function (Blueprint $table) {
            $table->dropColumn('received_at');
        });
    }
};
