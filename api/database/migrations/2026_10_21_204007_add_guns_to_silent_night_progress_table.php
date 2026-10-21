<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The guns each player has unlocked with coal (the candy cane gun is always theirs).
     */
    public function up(): void
    {
        Schema::table('silent_night_progress', function (Blueprint $table) {
            $table->json('guns')->nullable()->after('patrons');
        });
    }

    public function down(): void
    {
        Schema::table('silent_night_progress', function (Blueprint $table) {
            $table->dropColumn('guns');
        });
    }
};
