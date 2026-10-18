<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Prestige ("wrapping up Christmas"): how many times each player has done it, the gems it
     * turned their spare coins into, and what they've bought with gems.
     */
    public function up(): void
    {
        Schema::table('elf_fling_progress', function (Blueprint $table) {
            $table->unsignedInteger('gems')->default(0)->after('coins');
            $table->unsignedInteger('prestiges')->default(0)->after('gems');
            $table->json('gem_upgrades')->nullable()->after('upgrades');
        });
    }

    public function down(): void
    {
        Schema::table('elf_fling_progress', function (Blueprint $table) {
            $table->dropColumn(['gems', 'prestiges', 'gem_upgrades']);
        });
    }
};
