<?php

namespace App\Support\SilentNight;

use App\Models\User;
use App\Support\ElfFling\Leaderboard as ElfFlingLeaderboard;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

/**
 * The Silent Night leaderboards, across everyone on the site, this week (Monday to Sunday, the
 * organizer's time) or all time: each player's longest night (the most broken breaking a tie,
 * as every win reaches dawn), the most of Krampus's bargains they've taken and still beaten him,
 * or the most of his horde broken in a night. Names show as on Elf Fling's ("Holly B.").
 */
class Leaderboard
{
    /**
     * The longest night's score is its seconds and kills in one number, seconds first: kills are
     * under this (RecordRunRequest caps them at a million).
     */
    private const KILLS_UNDER = 10_000_000;

    /**
     * The top players, and where the viewer stands even if they're further down.
     *
     * @param  'night'|'krampus'|'kills'  $board
     * @param  'week'|'all'  $period
     * @return array{entries: array<int, array{rank: int, name: string, value: int, is_you: bool}>, you: array{rank: int, value: int}|null}
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
            if ((int) $row->score !== $previous) {
                $rank = $index + 1;
                $previous = (int) $row->score;
            }

            $entries[] = [
                'rank' => $rank,
                'name' => ElfFlingLeaderboard::displayName((string) $row->first_name, $row->last_name),
                'value' => self::value($board, (int) $row->score),
                'is_you' => (int) $row->id === $viewer->id,
            ];
        }

        $mine = (clone $scores)->where('users.id', $viewer->id)->first();
        $you = null;

        if ($mine !== null) {
            $ahead = DB::query()->fromSub(clone $scores, 'scores')->where('score', '>', $mine->score)->count();
            $you = ['rank' => $ahead + 1, 'value' => self::value($board, (int) $mine->score)];
        }

        return ['entries' => $entries, 'you' => $you];
    }

    /**
     * Each player's best for the period, one row per player, with their name. Kids and pets never
     * play. Krampus's board counts only nights won (a win with no bargains still counts, at 0).
     *
     * @param  'night'|'krampus'|'kills'  $board
     * @param  'week'|'all'  $period
     */
    private static function scores(string $board, string $period): Builder
    {
        $score = match ($board) {
            'night' => 'max(silent_night_runs.seconds * '.self::KILLS_UNDER.' + silent_night_runs.kills)',
            'krampus' => 'max(silent_night_runs.bargains)',
            'kills' => 'max(silent_night_runs.kills)',
        };

        return DB::table('silent_night_runs')
            ->join('users', 'users.id', '=', 'silent_night_runs.user_id')
            ->whereNull('users.managed_kind')
            ->when($board === 'krampus', fn (Builder $query) => $query->where('silent_night_runs.won', true))
            ->when($period === 'week', fn (Builder $query) => $query->where('silent_night_runs.created_at', '>=', ElfFlingLeaderboard::weekStart()))
            ->groupBy('users.id', 'users.first_name', 'users.last_name')
            ->select('users.id', 'users.first_name', 'users.last_name')
            ->selectRaw("{$score} as score")
            ->when($board !== 'krampus', fn (Builder $query) => $query->havingRaw("{$score} > 0"));
    }

    /**
     * What a board shows for a score: the longest night shows its seconds.
     */
    private static function value(string $board, int $score): int
    {
        return $board === 'night' ? intdiv($score, self::KILLS_UNDER) : $score;
    }
}
