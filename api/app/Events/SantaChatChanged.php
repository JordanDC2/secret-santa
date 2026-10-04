<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * A Santa ↔ person thread changed (a new message, or one side read it). Sent to one user's
 * own channel, carrying only the group id, so it can never hint at who someone's Santa is.
 */
class SantaChatChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(public readonly int $userId, public readonly int $groupId) {}

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel("user.{$this->userId}");
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
        return 'santa-chat.changed';
    }
}
