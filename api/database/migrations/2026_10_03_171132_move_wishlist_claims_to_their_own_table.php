<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Items can have a quantity (e.g. "4-pack of socks" x2), so one item can be claimed by
 * several people for part of it. Claims move from a single claimed_by_id on the item to
 * their own table: one row per person per item, with how many they're getting.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('wishlist_items', function (Blueprint $table) {
            $table->unsignedSmallInteger('quantity')->default(1)->after('price');
        });

        Schema::create('wishlist_claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wishlist_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('quantity');
            $table->timestamps();

            $table->unique(['wishlist_item_id', 'user_id']);
        });

        // Every existing claim becomes a claim of 1 (all existing items have quantity 1).
        DB::table('wishlist_items')->whereNotNull('claimed_by_id')->orderBy('id')->each(function (object $item) {
            DB::table('wishlist_claims')->insert([
                'wishlist_item_id' => $item->id,
                'user_id' => $item->claimed_by_id,
                'quantity' => 1,
                'created_at' => $item->claimed_at ?? now(),
                'updated_at' => $item->claimed_at ?? now(),
            ]);
        });

        Schema::table('wishlist_items', function (Blueprint $table) {
            $table->dropForeign(['claimed_by_id']);
            $table->dropColumn(['claimed_by_id', 'claimed_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wishlist_items', function (Blueprint $table) {
            $table->foreignId('claimed_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('claimed_at')->nullable();
        });

        // Single-claimer columns can only hold one person: keep the earliest claim.
        DB::table('wishlist_claims')->orderBy('id')->each(function (object $claim) {
            DB::table('wishlist_items')->where('id', $claim->wishlist_item_id)->whereNull('claimed_by_id')
                ->update(['claimed_by_id' => $claim->user_id, 'claimed_at' => $claim->created_at]);
        });

        Schema::dropIfExists('wishlist_claims');

        Schema::table('wishlist_items', function (Blueprint $table) {
            $table->dropColumn('quantity');
        });
    }
};
