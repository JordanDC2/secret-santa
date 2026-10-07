<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Email verification starts now. Accounts made before it have been getting assignment and
     * chat emails already, so their addresses demonstrably work: count them as verified, as of
     * when they signed up. Kids and pets have no real address and are left alone.
     */
    public function up(): void
    {
        DB::table('users')
            ->whereNull('managed_kind')
            ->whereNull('email_verified_at')
            ->update(['email_verified_at' => DB::raw('created_at')]);
    }

    /**
     * Nothing to undo: these accounts were never asked to verify.
     */
    public function down(): void {}
};
