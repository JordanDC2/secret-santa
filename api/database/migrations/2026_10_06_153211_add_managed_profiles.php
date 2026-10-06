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
        Schema::table('users', function (Blueprint $table) {
            // Set for a managed profile (a kid or pet without a login): "child" or "pet".
            // Profiles are users so groups, wishlists and draws treat them like anyone else.
            $table->string('managed_kind')->nullable()->after('email_preferences');
        });

        // Who manages each profile: usually a parent, and possibly a second one.
        Schema::create('profile_managers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('profile_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('manager_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['profile_id', 'manager_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('profile_managers');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('managed_kind');
        });
    }
};
