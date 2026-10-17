<?php

namespace App\Support\ElfFling;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

/**
 * The Elf Fling leaderboards, across everyone on the site: best distance, most coins earned
 * or most swings taken, this week (Monday to Sunday, the organizer's time) or all time. People show as
 * first name and last initial ("Holly B."), never their full name or anything else.
 */
class Leaderboard
{
    /**
     * The top players, and where the viewer stands even if they're further down.
     *
     * @param  'distance'|'coins'|'swings'  $board
     * @param  'week'|'all'  $period
     * @return array{entries: array<int, array{rank: int, name: string, value: float|int, is_you: bool}>, you: array{rank: int, value: float|int}|null}
     */
    public static function for(string $board, string $period, User $viewer): array
    {
        $scores = self::scores($board, $period);
        $top = (clone $scores)->orderByDesc('score')->orderBy('users.id')->limit(config('elf_fling.leaderboard_size'))->get();

        $entries = [];
        $rank = 0;
        $previous = null;

        foreach ($top as $index => $row) {
            // Ties share a rank: 1, 2, 2, 4.
            if ($row->score !== $previous) {
                $rank = $index + 1;
                $previous = $row->score;
            }

            $entries[] = [
                'rank' => $rank,
                'name' => self::displayName((string) $row->first_name, $row->last_name),
                'value' => self::value($board, $row->score),
                'is_you' => (int) $row->id === $viewer->id,
            ];
        }

        $mine = (clone $scores)->where('users.id', $viewer->id)->first();
        $you = null;

        if ($mine !== null) {
            $ahead = DB::query()->fromSub(clone $scores, 'scores')->where('score', '>', $mine->score)->count();
            $you = ['rank' => $ahead + 1, 'value' => self::value($board, $mine->score)];
        }

        return ['entries' => $entries, 'you' => $you];
    }

    /**
     * "Holly B.": the first name in title case (unless it was typed with deliberate capitals,
     * like "DeShawn") and the last name's initial. Just the first name if there's no last name.
     */
    public static function displayName(string $firstName, ?string $lastName): string
    {
        $first = self::titleCase(trim($firstName));
        $initial = mb_strtoupper(mb_substr(trim((string) $lastName), 0, 1));

        return $initial === '' ? $first : "{$first} {$initial}.";
    }

    /**
     * Each player's best distance or coin total for the period, one row per player, with their
     * name. Kids and pets never play, and a device's imported best counts for all time only.
     *
     * @param  'distance'|'coins'|'swings'  $board
     * @param  'week'|'all'  $period
     */
    private static function scores(string $board, string $period): Builder
    {
        $score = match ($board) {
            'distance' => 'max(elf_fling_throws.distance)',
            'coins' => 'sum(elf_fling_throws.coins)',
            'swings' => 'count(elf_fling_throws.id)',
        };

        return DB::table('elf_fling_throws')
            ->join('users', 'users.id', '=', 'elf_fling_throws.user_id')
            ->whereNull('users.managed_kind')
            // A device's imported best throw isn't a swing taken here.
            ->when($board === 'swings', fn (Builder $query) => $query->where('elf_fling_throws.from_device', false))
            ->when($period === 'week', fn (Builder $query) => $query
                ->where('elf_fling_throws.created_at', '>=', self::weekStart())
                ->where('elf_fling_throws.from_device', false))
            ->groupBy('users.id', 'users.first_name', 'users.last_name')
            ->select('users.id', 'users.first_name', 'users.last_name')
            ->selectRaw("{$score} as score")
            ->havingRaw("{$score} > 0");
    }

    /**
     * Monday 00:00 this week, in the organizer's timezone (as UTC for the database).
     */
    public static function weekStart(): CarbonImmutable
    {
        return CarbonImmutable::now(config('app.reminder_timezone'))->startOfWeek(CarbonImmutable::MONDAY)->utc();
    }

    /**
     * Names typed all lower or all upper case are tidied ("holly" or "HOLLY" become "Holly");
     * anything with mixed case is left as its owner wrote it.
     */
    private static function titleCase(string $name): string
    {
        $lower = mb_strtolower($name);
        $upper = mb_strtoupper($name);

        return $name === $lower || $name === $upper ? mb_convert_case($lower, MB_CASE_TITLE) : $name;
    }

    private static function value(string $board, mixed $score): float|int
    {
        return $board === 'distance' ? round((float) $score, 1) : (int) $score;
    }
}
