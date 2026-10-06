<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Renamed rather than rebuilt: SQLite renames a column in place.
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('name', 'first_name');
        });

        Schema::table('users', function (Blueprint $table) {
            // Required for adults from now on; optional for kids and pets. Accounts with a
            // one-word name start without one and are asked to add it.
            $table->string('last_name')->nullable()->after('first_name');
        });

        // "Mary Ann Smith" becomes "Mary Ann" + "Smith". Anyone it splits wrongly can fix it
        // on their Account page.
        DB::table('users')->select(['id', 'first_name'])->orderBy('id')->each(function (object $user) {
            $name = trim(preg_replace('/\s+/', ' ', $user->first_name) ?? $user->first_name);
            $space = strrpos($name, ' ');

            DB::table('users')->where('id', $user->id)->update($space === false
                ? ['first_name' => $name, 'last_name' => null]
                : ['first_name' => substr($name, 0, $space), 'last_name' => substr($name, $space + 1)]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('users')->whereNotNull('last_name')->where('last_name', '!=', '')
            ->update(['first_name' => DB::raw("first_name || ' ' || last_name")]);

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('last_name');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('first_name', 'name');
        });
    }
};
