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
        // Each player's Elf Fling progress: coins to spend and what they've bought.
        Schema::create('elf_fling_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedInteger('coins')->default(0);
            // Upgrade levels by id, e.g. {"swingStrength": 3}; missing means not bought.
            $table->json('upgrades')->nullable();
            // Looks owned (the free ones always are) and the ones in use.
            $table->json('skins')->nullable();
            $table->string('skin')->default('elf');
            $table->json('batters')->nullable();
            $table->string('batter')->default('reindeer');
            // When this browser's progress from before accounts was brought over (once only).
            $table->timestamp('imported_at')->nullable();
            $table->timestamps();
        });

        // Every finished throw, for the leaderboards (best distance, coins earned; this week or ever).
        Schema::create('elf_fling_throws', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->decimal('distance', 7, 1);
            $table->unsignedInteger('coins');
            // A best throw brought over from a device: counts for all time, not for this week.
            $table->boolean('from_device')->default(false);
            $table->timestamp('created_at')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('elf_fling_throws');
        Schema::dropIfExists('elf_fling_progress');
    }
};
