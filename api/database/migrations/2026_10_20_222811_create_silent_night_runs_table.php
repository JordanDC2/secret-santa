<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Each finished night of Silent Night, won or lost, for its leaderboards.
     */
    public function up(): void
    {
        Schema::create('silent_night_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // How far into the night the player got, up to dawn.
            $table->unsignedSmallInteger('seconds');
            $table->unsignedInteger('kills');
            $table->unsignedSmallInteger('level');
            // How many of Krampus's bargains they took.
            $table->unsignedTinyInteger('bargains');
            // Whether they beat Krampus at dawn.
            $table->boolean('won');
            $table->timestamp('created_at')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('silent_night_runs');
    }
};
