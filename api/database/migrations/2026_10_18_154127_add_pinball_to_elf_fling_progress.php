<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Christmas pinball, Elf Fling's secret level behind a chimney: when the player first found
     * it (which unlocks it as a game of its own), and their best score playing it on its own.
     */
    public function up(): void
    {
        Schema::table('elf_fling_progress', function (Blueprint $table) {
            $table->timestamp('pinball_unlocked_at')->nullable()->after('imported_at');
            $table->unsignedBigInteger('pinball_best')->default(0)->after('pinball_unlocked_at');
        });
    }

    public function down(): void
    {
        Schema::table('elf_fling_progress', function (Blueprint $table) {
            $table->dropColumn(['pinball_unlocked_at', 'pinball_best']);
        });
    }
};
