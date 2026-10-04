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
        // Anonymous messages between a Secret Santa and their person. They hang off the
        // assignment rather than user ids, so the Santa's identity is never part of a message.
        Schema::create('santa_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('secret_santa_assignment_id')->constrained()->cascadeOnDelete();
            // True when the Santa (the assignment's giver) wrote it, false for their person.
            $table->boolean('from_santa');
            $table->text('body');
            // When the other side opened the thread after this arrived.
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('santa_messages');
    }
};
