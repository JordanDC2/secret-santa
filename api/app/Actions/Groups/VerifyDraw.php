<?php

namespace App\Actions\Groups;

use App\Models\Group;
use App\Models\SecretSantaAssignment;

class VerifyDraw
{
    /**
     * Spoiler-free health check of a group's draw: each rule passes or fails, and failures
     * name people but never reveal who drew whom (except a broken exclusion, which has to).
     *
     * @return array{verified: bool, checks: array<int, array{label: string, passed: bool, problems: array<int, string>}>}
     */
    public function __invoke(Group $group): array
    {
        $members = $group->members()->get(['users.id', 'users.name'])->keyBy('id');
        // Only those in the draw need a person and a Santa; anyone sitting it out has neither.
        $drawn = $group->drawMembers()->pluck('users.id');
        $assignments = $group->currentAssignments()->get();
        $name = fn (int $id): string => $members[$id]->name ?? 'A former member';

        $checks = [
            $this->check(
                'Everyone has exactly one person to buy for',
                $drawn
                    ->filter(fn (int $id) => $assignments->where('giver_id', $id)->count() !== 1)
                    ->map(fn (int $id) => "{$name($id)} doesn't have exactly one person to buy for."),
            ),
            $this->check(
                'Everyone has exactly one Secret Santa',
                $drawn
                    ->filter(fn (int $id) => $assignments->where('receiver_id', $id)->count() !== 1)
                    ->map(fn (int $id) => "{$name($id)} doesn't have exactly one Secret Santa."),
            ),
            $this->check(
                'Nobody drew themselves',
                $assignments
                    ->filter(fn (SecretSantaAssignment $assignment) => $assignment->giver_id === $assignment->receiver_id)
                    ->map(fn (SecretSantaAssignment $assignment) => "{$name($assignment->giver_id)} drew themselves."),
            ),
            $this->check(
                'Every exclusion was respected',
                collect($group->blockedPairsAmong($drawn->all()))
                    ->filter(fn (array $pair) => $assignments->contains(
                        fn (SecretSantaAssignment $assignment) => [$assignment->giver_id, $assignment->receiver_id] === $pair,
                    ))
                    ->map(fn (array $pair) => "{$name($pair[0])} drew {$name($pair[1])} despite an exclusion."),
            ),
        ];

        return [
            'verified' => collect($checks)->every(fn (array $check) => $check['passed']),
            'checks' => $checks,
        ];
    }

    /**
     * @param  iterable<string>  $problems
     * @return array{label: string, passed: bool, problems: array<int, string>}
     */
    private function check(string $label, iterable $problems): array
    {
        $problems = collect($problems)->values()->all();

        return ['label' => $label, 'passed' => $problems === [], 'problems' => $problems];
    }
}
