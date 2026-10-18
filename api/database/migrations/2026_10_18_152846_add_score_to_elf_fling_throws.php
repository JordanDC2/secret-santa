<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Each throw's score: its distance in metres plus the coins it collected (before any
     * multipliers), for the Score leaderboard. Throws from before keep only their banked coins,
     * so theirs is worked out from those.
     */
    public function up(): void
    {
        Schema::table('elf_fling_throws', function (Blueprint $table) {
            $table->unsignedBigInteger('score')->default(0)->after('coins');
        });

        DB::table('elf_fling_throws')->update(['score' => DB::raw('round(distance) + coins')]);
    }

    public function down(): void
    {
        Schema::table('elf_fling_throws', function (Blueprint $table) {
            $table->dropColumn('score');
        });
    }
};
