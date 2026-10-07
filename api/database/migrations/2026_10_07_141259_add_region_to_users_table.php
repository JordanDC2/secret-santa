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
            // Roughly where someone uses the app, for the admin page's map: a country code
            // ("US") and state or province ("Wisconsin"), worked out from their internet
            // address. Never a town, and the address itself isn't kept here.
            $table->char('region_country', 2)->nullable()->after('email_preferences');
            $table->string('region_name')->nullable()->after('region_country');
            $table->timestamp('region_checked_at')->nullable()->after('region_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['region_country', 'region_name', 'region_checked_at']);
        });
    }
};
