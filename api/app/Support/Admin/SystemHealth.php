<?php

namespace App\Support\Admin;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

/**
 * Is the site working: what's live, whether emails are getting out, when the last backup ran
 * and what's gone wrong lately. Never reads people's data, only the plumbing around it.
 */
class SystemHealth
{
    private const RECENT_ERRORS = 10;

    // Enough of the log's end for the last few errors without reading the whole file.
    private const LOG_TAIL_BYTES = 262_144;

    /**
     * @return array<string, mixed>
     */
    public function report(): array
    {
        return [
            'version' => $this->version(),
            'queued_jobs' => $this->queuedJobs(),
            'failed_jobs' => $this->failedJobs(),
            'last_backup' => $this->lastBackup(),
            'recent_errors' => $this->recentErrors(),
        ];
    }

    /**
     * The commit the live web app was built from (deploy/update.sh writes it into the build).
     */
    private function version(): ?string
    {
        $file = base_path('../web/dist/version.json');
        $data = is_file($file) ? json_decode((string) file_get_contents($file), true) : null;

        return is_array($data) && is_string($data['version'] ?? null) ? $data['version'] : null;
    }

    /**
     * Jobs waiting per queue, and how long the oldest has been ready to run. Email jobs that
     * are meant to wait (a chat email's few minutes, say) only count once they're due.
     *
     * @return array<int, array{queue: string, count: int, oldest_due_at: ?string}>
     */
    private function queuedJobs(): array
    {
        return DB::table('jobs')
            ->selectRaw('queue, count(*) as count, min(available_at) as oldest')
            ->where('available_at', '<=', now()->timestamp)
            ->groupBy('queue')
            ->orderBy('queue')
            ->get()
            ->map(fn (object $row) => [
                'queue' => (string) $row->queue,
                'count' => (int) $row->count,
                'oldest_due_at' => $row->oldest ? Carbon::createFromTimestamp((int) $row->oldest)->toIso8601String() : null,
            ])
            ->all();
    }

    /**
     * Jobs that gave up after their retries: mostly emails that couldn't be sent.
     *
     * @return array<int, array{uuid: string, job: string, queue: string, failed_at: string, error: string}>
     */
    private function failedJobs(): array
    {
        return DB::table('failed_jobs')
            ->orderByDesc('failed_at')
            ->get(['uuid', 'queue', 'payload', 'exception', 'failed_at'])
            ->map(function (object $row) {
                $payload = json_decode((string) $row->payload, true);

                return [
                    'uuid' => (string) $row->uuid,
                    // For an email this is the notification's class, e.g. "SecretSantaAssigned".
                    'job' => class_basename(is_array($payload) ? (string) ($payload['displayName'] ?? 'Unknown job') : 'Unknown job'),
                    'queue' => (string) $row->queue,
                    'failed_at' => Carbon::parse((string) $row->failed_at)->toIso8601String(),
                    'error' => Str::limit(Str::before((string) $row->exception, "\n"), 300),
                ];
            })
            ->all();
    }

    /**
     * Written by deploy/backup-database.sh after each nightly backup (the backups themselves
     * are root-only, so the app can't look at them).
     *
     * @return array{finished_at: string, bytes: int, offsite_finished_at: ?string}|null
     */
    private function lastBackup(): ?array
    {
        $file = storage_path('app/backup-status.json');
        $data = is_file($file) ? json_decode((string) file_get_contents($file), true) : null;

        if (! is_array($data) || ! is_string($data['finished_at'] ?? null)) {
            return null;
        }

        try {
            $finishedAt = Carbon::parse($data['finished_at'])->toIso8601String();
        } catch (Throwable) {
            return null;
        }

        // Written by deploy/offsite-backup.sh once the encrypted copy is in Object Storage.
        $offsite = $data['offsite_finished_at'] ?? null;

        return [
            'finished_at' => $finishedAt,
            'bytes' => (int) ($data['bytes'] ?? 0),
            'offsite_finished_at' => is_string($offsite) ? Carbon::parse($offsite)->toIso8601String() : null,
        ];
    }

    /**
     * The newest errors in the app's logs, first line only. Production writes a file per day
     * (laravel-2026-10-07.log), development one laravel.log; only this environment's lines count.
     *
     * @return array<int, array{logged_at: string, level: string, message: string}>
     */
    private function recentErrors(): array
    {
        $files = glob(storage_path('logs/laravel*.log')) ?: [];
        usort($files, fn (string $a, string $b) => filemtime($b) <=> filemtime($a));
        $environment = preg_quote(app()->environment(), '/');
        $errors = [];

        foreach ($files as $file) {
            preg_match_all("/^\\[([^\\]]+)\\] {$environment}\\.(ERROR|CRITICAL|ALERT|EMERGENCY): (.*)$/m", $this->tail($file), $matches, PREG_SET_ORDER);

            foreach (array_reverse($matches) as $match) {
                $errors[] = [
                    'logged_at' => Carbon::parse($match[1])->toIso8601String(),
                    'level' => strtolower($match[2]),
                    'message' => Str::limit($match[3], 300),
                ];

                if (count($errors) === self::RECENT_ERRORS) {
                    return $errors;
                }
            }
        }

        return $errors;
    }

    /**
     * The end of a log file: enough for the last few errors without reading all of it.
     */
    private function tail(string $file): string
    {
        $handle = fopen($file, 'r');

        if ($handle === false) {
            return '';
        }

        fseek($handle, max(0, (int) filesize($file) - self::LOG_TAIL_BYTES));
        $tail = (string) stream_get_contents($handle);
        fclose($handle);

        return $tail;
    }
}
