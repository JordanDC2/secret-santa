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
        Schema::table('groups', function (Blueprint $table) {
            // The gift exchange's day (no time: place and time live in the group note).
            $table->date('exchange_date')->nullable()->after('description');
            // Whole dollars. A single amount sets only budget_max; a range sets both.
            $table->unsignedInteger('budget_min')->nullable()->after('exchange_date');
            $table->unsignedInteger('budget_max')->nullable()->after('budget_min');
        });

        // Which reminder emails went out, so each is sent once per exchange date even if the
        // daily job runs twice. Keyed by the date, so moving the exchange sends fresh ones.
        Schema::create('group_reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained()->cascadeOnDelete();
            $table->string('kind');
            $table->date('exchange_date');
            $table->timestamp('created_at')->nullable();

            $table->unique(['group_id', 'kind', 'exchange_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('group_reminders');

        Schema::table('groups', function (Blueprint $table) {
            $table->dropColumn(['exchange_date', 'budget_min', 'budget_max']);
        });
    }
};
