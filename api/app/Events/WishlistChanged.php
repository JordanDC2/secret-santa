<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Someone's wishlist changed, including claims. Carries only the owner's id, and the
 * owner can't subscribe to their own channel (see UserPolicy), so a claim never
 * reaches them even as a "something happened" ping.
 */
class WishlistChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(public readonly int $ownerId) {}

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel("wishlist.{$this->ownerId}");
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
        return 'wishlist.changed';
    }
}
