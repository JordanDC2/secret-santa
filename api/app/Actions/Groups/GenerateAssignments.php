<?php

namespace App\Actions\Groups;

class GenerateAssignments
{
    /**
     * Randomly pair each giver with a receiver such that no one is assigned to themselves.
     *
     * @param  array<int>  $memberIds
     * @return array<int, int> Keyed by giver id, valued by receiver id.
     */
    public function __invoke(array $memberIds): array
    {
        do {
            $receivers = $memberIds;
            shuffle($receivers);

            $isValid = ! $this->hasSelfAssignment($memberIds, $receivers);
        } while (! $isValid);

        return array_combine($memberIds, $receivers);
    }

    /**
     * @param  array<int>  $memberIds
     * @param  array<int>  $receivers
     */
    private function hasSelfAssignment(array $memberIds, array $receivers): bool
    {
        foreach ($memberIds as $index => $giverId) {
            if ($giverId === $receivers[$index]) {
                return true;
            }
        }

        return false;
    }
}
