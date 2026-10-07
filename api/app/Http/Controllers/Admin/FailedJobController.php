<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

/**
 * Jobs that ran out of retries (usually an email Gmail wouldn't take): try again, or let go.
 */
class FailedJobController extends Controller
{
    public function retry(string $uuid): Response
    {
        abort_unless(DB::table('failed_jobs')->where('uuid', $uuid)->exists(), 404);

        Artisan::call('queue:retry', ['id' => [$uuid]]);

        return response()->noContent();
    }

    public function destroy(string $uuid): Response
    {
        abort_unless(DB::table('failed_jobs')->where('uuid', $uuid)->delete() > 0, 404);

        return response()->noContent();
    }
}
