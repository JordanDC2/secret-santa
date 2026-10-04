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
        Schema::table('wishlist_items', function (Blueprint $table) {
            // A gift idea someone else added to this person's list; the list's owner never sees
            // these. Its own flag (not "has a suggester") so it stays hidden from the owner even
            // after the suggester deletes their account.
            $table->boolean('is_suggestion')->default(false)->after('user_id');
            $table->foreignId('suggested_by_id')->nullable()->after('is_suggestion')
                ->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wishlist_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('suggested_by_id');
            $table->dropColumn('is_suggestion');
        });
    }
};
