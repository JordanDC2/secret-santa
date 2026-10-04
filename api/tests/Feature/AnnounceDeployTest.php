<?php

namespace Tests\Feature;

use App\Events\AppDeployed;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class AnnounceDeployTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_deploy_command_announces_the_new_version_to_everyone(): void
    {
        Event::fake([AppDeployed::class]);

        $this->assertSame(0, Artisan::call('app:announce-deploy', ['version' => 'abc1234']));

        Event::assertDispatched(AppDeployed::class, fn (AppDeployed $event) => $event->version === 'abc1234'
            && $event->broadcastOn()->name === 'app');
    }
}
