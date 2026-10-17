<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Someone finished an Elf Fling throw (or brought over a device's best), so the leaderboards
 * may have moved. Carries nothing: anyone watching re-fetches the board they're looking at.
 */
class ElfFlingLeaderboardChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('elf-fling');
    }

    /**
     * With the other live updates, never waiting behind email. Workers run `--queue=broadcasts,default`.
     */
    public function broadcastQueue(): string
    {
        return 'broadcasts';
    }

    public function broadcastAs(): string
    {
        return 'leaderboard.changed';
    }
}
