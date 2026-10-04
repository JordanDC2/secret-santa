<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * A new version of the site went live. Open pages compare the version with their own
 * and offer to refresh. Public, since it says nothing about anyone.
 *
 * Sent straight away rather than queued: the deploy restarts the queue worker.
 */
class AppDeployed implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(public readonly string $version) {}

    public function broadcastOn(): Channel
    {
        return new Channel('app');
    }

    public function broadcastAs(): string
    {
        return 'app.deployed';
    }
}
