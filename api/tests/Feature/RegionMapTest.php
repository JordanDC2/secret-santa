<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\Geo\IpLocator;
use Illuminate\Console\Command;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RegionMapTest extends TestCase
{
    use RefreshDatabase;

    private int $lookups = 0;

    protected function setUp(): void
    {
        parent::setUp();

        // Stand-in for the DB-IP file: every address is in Wisconsin.
        $this->app->instance(IpLocator::class, new class(fn () => $this->lookups++) extends IpLocator
        {
            public function __construct(private readonly \Closure $onLookup) {}

            public function locate(string $ip): array
            {
                ($this->onLookup)();

                return ['country' => 'US', 'region' => 'Wisconsin'];
            }

            public function builtAt(): ?int
            {
                return null;
            }
        });
    }

    public function test_signed_in_requests_note_the_region_at_most_once_a_day(): void
    {
        $user = User::factory()->create();
        $updatedAt = $user->updated_at;
        Sanctum::actingAs($user);

        $this->getJson('/api/user')->assertOk()->assertJsonMissingPath('region_country');
        $this->getJson('/api/user')->assertOk();

        $user->refresh();
        $this->assertSame('US', $user->region_country);
        $this->assertSame('Wisconsin', $user->region_name);
        $this->assertEquals($updatedAt, $user->updated_at);
        $this->assertSame(1, $this->lookups);

        $this->travel(25)->hours();
        $this->getJson('/api/user')->assertOk();
        $this->assertSame(2, $this->lookups);
    }

    public function test_the_admin_map_counts_accounts_per_country_and_state_but_never_names(): void
    {
        config(['app.admin_email' => 'owner@example.com']);
        $admin = User::factory()->create(['email' => 'owner@example.com', 'region_country' => 'US', 'region_name' => 'Wisconsin', 'region_checked_at' => now()]);
        User::factory()->create(['first_name' => 'Zed', 'region_country' => 'US', 'region_name' => 'Wisconsin', 'region_checked_at' => now()]);
        User::factory()->create(['region_country' => 'GB', 'region_name' => 'England', 'region_checked_at' => now()]);
        User::factory()->create();

        Sanctum::actingAs($admin);
        $response = $this->getJson(route('admin.locations'))
            ->assertOk()
            ->assertJsonPath('countries.0', ['country' => 'US', 'count' => 2])
            ->assertJsonPath('countries.1', ['country' => 'GB', 'count' => 1])
            ->assertJsonPath('regions.0', ['country' => 'US', 'region' => 'Wisconsin', 'count' => 2])
            ->assertJsonPath('unknown', 1);

        $this->assertStringNotContainsString('Zed', $response->getContent() ?: '');

        Sanctum::actingAs(User::factory()->create());
        $this->getJson(route('admin.locations'))->assertForbidden();
    }

    public function test_a_failed_location_download_leaves_nothing_behind(): void
    {
        $path = storage_path('framework/testing/geo/dbip-city-lite.mmdb');
        config(['services.dbip.path' => $path]);
        Http::fake(['download.db-ip.com/*' => Http::response('Not found', 404)]);

        $this->assertSame(Command::FAILURE, Artisan::call('geo:update'));

        $this->assertFileDoesNotExist($path);
        $this->assertSame([], glob(dirname($path).'/*') ?: []);
        // It tries this month's file, then last month's.
        Http::assertSentCount(2);
    }
}
