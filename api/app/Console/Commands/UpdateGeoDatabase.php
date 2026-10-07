<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use MaxMind\Db\Reader;
use Throwable;

#[Signature('geo:update {--if-missing : Only download when there is no file yet (deploys use this)}')]
#[Description("Download this month's DB-IP location file for the admin page's map")]
class UpdateGeoDatabase extends Command
{
    public function handle(): int
    {
        $path = (string) config('services.dbip.path');

        if ($this->option('if-missing') && is_file($path)) {
            $this->info('The location file is already there.');

            return self::SUCCESS;
        }

        if (! is_dir(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }

        // Early in a month the new file may not be out yet; last month's will do.
        foreach ([now()->format('Y-m'), now()->subMonthNoOverflow()->format('Y-m')] as $month) {
            if ($this->download($month, $path)) {
                $this->info("Location file for {$month} installed.");

                return self::SUCCESS;
            }
        }

        $this->error("Couldn't download a location file; the map keeps using the old one, if any.");

        return self::FAILURE;
    }

    /**
     * Downloads and unpacks into a temporary file, checks it opens, then swaps it in, so a
     * failed download never leaves a broken file behind.
     */
    private function download(string $month, string $path): bool
    {
        $gzipped = "{$path}.download.gz";
        $unpacked = "{$path}.download";

        try {
            $response = Http::timeout(300)->sink($gzipped)->get(sprintf((string) config('services.dbip.url'), $month));

            if (! $response->successful()) {
                return false;
            }

            $in = gzopen($gzipped, 'rb');
            $out = fopen($unpacked, 'wb');

            if ($in === false || $out === false) {
                return false;
            }

            while (! gzeof($in)) {
                fwrite($out, (string) gzread($in, 1 << 20));
            }

            gzclose($in);
            fclose($out);

            (new Reader($unpacked))->close();

            return rename($unpacked, $path);
        } catch (Throwable $exception) {
            $this->warn("{$month}: {$exception->getMessage()}");

            return false;
        } finally {
            @unlink($gzipped);
            @unlink($unpacked);
        }
    }
}
