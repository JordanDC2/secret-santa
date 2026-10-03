<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Groups can draw again (e.g. every Christmas). Each draw gets a number; the group's
 * draw_number is the current one, and older assignments stay as history.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->unsignedInteger('draw_number')->default(1)->after('drawn_at');
        });

        Schema::table('secret_santa_assignments', function (Blueprint $table) {
            $table->unsignedInteger('draw_number')->default(1)->after('group_id');
            $table->dropUnique(['group_id', 'giver_id']);
            $table->unique(['group_id', 'draw_number', 'giver_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('secret_santa_assignments', function (Blueprint $table) {
            $table->dropUnique(['group_id', 'draw_number', 'giver_id']);
            $table->unique(['group_id', 'giver_id']);
            $table->dropColumn('draw_number');
        });

        Schema::table('groups', function (Blueprint $table) {
            $table->dropColumn('draw_number');
        });
    }
};
