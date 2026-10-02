<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Something about a group changed (members, draw, deletion). Carries only the id:
 * listeners re-fetch through the API, so no group data travels over the socket.
 */
class GroupChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(public readonly int $groupId) {}

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel("group.{$this->groupId}");
    }

    /**
     * Separate from email (the default queue) so live updates never wait behind a
     * retrying send. Workers run `--queue=broadcasts,default`.
     */
    public function broadcastQueue(): string
    {
        return 'broadcasts';
    }

    public function broadcastAs(): string
    {
        return 'group.changed';
    }
}
