<?php

namespace App\Actions\Groups;

class GenerateAssignments
{
    /** @var array<int, array<int>> Giver id => receiver ids they may draw, in random order. */
    private array $candidates = [];

    /** @var array<int, int> Receiver id => giver currently matched to them. */
    private array $giverOf = [];

    /** @var array<int, true> Receivers already tried during the current search. */
    private array $visited = [];

    /**
     * Randomly pair each giver with a receiver: nobody draws themselves and no blocked
     * pair is used. This is a bipartite matching (givers on one side, receivers on the
     * other) solved with augmenting paths, so it always finds an answer when one exists
     * and reports when none does, instead of reshuffling forever.
     *
     * @param  array<int>  $memberIds
     * @param  array<int, array{int, int}>  $blockedPairs  [giver id, receiver id] pairs that may not be drawn.
     * @return array<int, int>|null Keyed by giver id (in $memberIds order), or null if no valid draw exists.
     */
    public function __invoke(array $memberIds, array $blockedPairs = []): ?array
    {
        $blocked = [];
        foreach ($blockedPairs as [$giverId, $receiverId]) {
            $blocked[$giverId][$receiverId] = true;
        }

        $this->candidates = [];
        $this->giverOf = [];

        foreach ($memberIds as $giverId) {
            $options = array_values(array_filter(
                $memberIds,
                fn (int $receiverId) => $receiverId !== $giverId && ! isset($blocked[$giverId][$receiverId]),
            ));
            shuffle($options);
            $this->candidates[$giverId] = $options;
        }

        $givers = $memberIds;
        shuffle($givers);

        foreach ($givers as $giverId) {
            $this->visited = [];

            if (! $this->match($giverId)) {
                return null;
            }
        }

        $receiverOf = array_flip($this->giverOf);

        return array_combine($memberIds, array_map(fn (int $giverId) => $receiverOf[$giverId], $memberIds));
    }

    /**
     * Find this giver a receiver, bumping an earlier giver to another option if needed.
     */
    private function match(int $giverId): bool
    {
        foreach ($this->candidates[$giverId] as $receiverId) {
            if (isset($this->visited[$receiverId])) {
                continue;
            }

            $this->visited[$receiverId] = true;

            if (! isset($this->giverOf[$receiverId]) || $this->match($this->giverOf[$receiverId])) {
                $this->giverOf[$receiverId] = $giverId;

                return true;
            }
        }

        return false;
    }
}
