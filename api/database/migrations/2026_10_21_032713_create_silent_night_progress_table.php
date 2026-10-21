<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Each player's Silent Night progress, kept between nights: their coal, the Coal Cellar's
     * upgrades bought, and who they've unlocked and last played as.
     */
    public function up(): void
    {
        Schema::create('silent_night_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedInteger('coal')->default(0);
            $table->json('cellar')->nullable();
            $table->json('cast')->nullable();
            $table->string('character', 20);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('silent_night_progress');
    }
};
