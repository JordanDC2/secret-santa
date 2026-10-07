<?php

namespace Tests\Feature;

use App\Jobs\SendExchangeChangeEmail;
use App\Models\Group;
use App\Models\User;
use App\Notifications\ResetPasswordLink;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        config(['app.admin_email' => 'Owner@Example.com']);
        $this->admin = User::factory()->create(['email' => 'owner@example.com']);
    }

    public function test_only_the_admin_email_gets_the_admin_page(): void
    {
        Sanctum::actingAs($this->admin);
        $this->getJson('/api/user')->assertJsonPath('is_admin', true);
        $this->getJson(route('admin.overview'))->assertOk();

        $someone = User::factory()->create();
        Sanctum::actingAs($someone);
        $this->getJson('/api/user')->assertJsonPath('is_admin', false);

        foreach (['admin.overview', 'admin.accounts.index', 'admin.groups.index'] as $route) {
            $this->getJson(route($route))->assertForbidden();
        }
        $this->deleteJson(route('admin.accounts.destroy', $this->admin))->assertForbidden();
        $this->assertModelExists($this->admin);
    }

    public function test_nobody_is_admin_without_an_admin_email(): void
    {
        config(['app.admin_email' => null]);
        Sanctum::actingAs($this->admin);

        $this->getJson(route('admin.overview'))->assertForbidden();
    }

    public function test_admin_emails_add_more_admins_for_local_development(): void
    {
        config(['app.admin_email' => null, 'app.admin_emails' => ['holly@example.test', 'OWNER@example.com']]);
        $holly = User::factory()->create(['email' => 'holly@example.test']);

        foreach ([$holly, $this->admin] as $admin) {
            Sanctum::actingAs($admin);
            $this->getJson(route('admin.overview'))->assertOk();
        }

        Sanctum::actingAs(User::factory()->create());
        $this->getJson(route('admin.overview'))->assertForbidden();
    }

    public function test_the_overview_counts_things_and_sign_ups_by_day(): void
    {
        Group::factory()->create(['owner_id' => $this->admin->id, 'drawn_at' => now()]);
        Group::factory()->create();
        Sanctum::actingAs($this->admin);
        $this->postJson(route('account.profiles.store'), ['first_name' => 'Lily', 'kind' => 'child'])->assertCreated();

        $response = $this->getJson(route('admin.overview'))
            ->assertOk()
            // The admin plus the other group's owner; Lily is a kid, not an account.
            ->assertJsonPath('counts.accounts', 2)
            ->assertJsonPath('counts.kids_and_pets', 1)
            ->assertJsonPath('counts.groups', 2)
            ->assertJsonPath('counts.drawn_groups', 1)
            ->assertJsonCount(30, 'sign_ups')
            ->assertJsonPath('sign_ups.29.count', 2)
            ->assertJsonStructure(['health' => ['version', 'queued_jobs', 'failed_jobs', 'last_backup', 'recent_errors']]);

        $this->assertStringNotContainsString('assignment', $response->getContent() ?: '');
    }

    public function test_accounts_list_their_groups_and_kids_but_not_kids_as_accounts(): void
    {
        $owner = User::factory()->create(['first_name' => 'Nick']);
        $owned = Group::factory()->create(['owner_id' => $owner->id, 'name' => 'Ski Trip']);
        $owned->members()->attach($this->admin->id);
        Sanctum::actingAs($owner);
        $this->postJson(route('account.profiles.store'), ['first_name' => 'Biscuit', 'kind' => 'pet'])->assertCreated();

        Sanctum::actingAs($this->admin);
        $accounts = $this->getJson(route('admin.accounts.index'))->assertOk()->collect();

        $this->assertCount(2, $accounts);
        $nick = $accounts->firstWhere('id', $owner->id);
        $this->assertSame('Ski Trip', $nick['owned_groups'][0]['name']);
        $this->assertSame(2, $nick['owned_groups'][0]['members_count']);
        $this->assertSame('Biscuit', $nick['kids_and_pets'][0]['name']);
        $this->assertSame([['id' => $owned->id, 'name' => 'Ski Trip']], $accounts->firstWhere('id', $this->admin->id)['member_of']);
    }

    public function test_the_admin_can_fix_someones_name_and_email(): void
    {
        $someone = User::factory()->create(['email' => 'typo@gmial.com']);
        User::factory()->create(['email' => 'taken@example.com']);
        Sanctum::actingAs($this->admin);

        $this->patchJson(route('admin.accounts.update', $someone), ['first_name' => 'Holly', 'last_name' => 'Berry', 'email' => 'taken@example.com'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');

        $this->patchJson(route('admin.accounts.update', $someone), ['first_name' => 'Holly', 'last_name' => 'Berry', 'email' => 'holly@gmail.com'])
            ->assertOk()
            ->assertJsonPath('email', 'holly@gmail.com');

        $this->assertSame('Holly Berry', $someone->fresh()?->full_name);
    }

    public function test_the_admin_can_send_a_password_reset_link(): void
    {
        Notification::fake();
        $someone = User::factory()->create();
        Sanctum::actingAs($this->admin);

        $this->postJson(route('admin.accounts.password-reset', $someone))->assertOk();

        Notification::assertSentTo($someone, ResetPasswordLink::class);
    }

    public function test_deleting_an_account_takes_its_groups_but_never_the_admins_own(): void
    {
        $someone = User::factory()->create();
        $group = Group::factory()->create(['owner_id' => $someone->id]);
        Sanctum::actingAs($this->admin);

        $this->deleteJson(route('admin.accounts.destroy', $this->admin))->assertUnprocessable();
        $this->deleteJson(route('admin.accounts.destroy', $someone))->assertNoContent();

        $this->assertModelMissing($someone);
        $this->assertModelMissing($group);
        $this->assertModelExists($this->admin);
    }

    public function test_the_admin_can_list_and_delete_any_group(): void
    {
        $group = Group::factory()->create(['name' => 'Office Party', 'budget_max' => 25]);
        Sanctum::actingAs($this->admin);

        $this->getJson(route('admin.groups.index'))
            ->assertOk()
            ->assertJsonPath('0.name', 'Office Party')
            ->assertJsonPath('0.owner.id', $group->owner_id)
            ->assertJsonPath('0.members_count', 1)
            ->assertJsonPath('0.is_drawn', false);

        $this->deleteJson(route('admin.groups.destroy', $group))->assertNoContent();
        $this->assertModelMissing($group);
    }

    public function test_failed_jobs_show_up_and_can_be_retried_or_dropped(): void
    {
        // Real queued jobs moved to failed_jobs, so retrying them works like it does live.
        $uuids = [];
        foreach ([1, 2] as $groupId) {
            Queue::connection('database')->push(new SendExchangeChangeEmail($groupId, 'v1'));
            $job = DB::table('jobs')->latest('id')->first();
            $payload = json_decode((string) $job?->payload, true);
            $uuids[] = $payload['uuid'];
            DB::table('failed_jobs')->insert([
                'uuid' => $payload['uuid'],
                'connection' => 'database',
                'queue' => 'default',
                'payload' => $job?->payload,
                'exception' => "Symfony\\Component\\Mailer\\Exception\\TransportException: Connection refused\n#0 stack trace",
                'failed_at' => now(),
            ]);
        }
        DB::table('jobs')->delete();
        Sanctum::actingAs($this->admin);

        $this->getJson(route('admin.overview'))
            ->assertJsonCount(2, 'health.failed_jobs')
            ->assertJsonPath('health.failed_jobs.0.job', 'SendExchangeChangeEmail')
            ->assertJsonPath('health.failed_jobs.0.error', 'Symfony\\Component\\Mailer\\Exception\\TransportException: Connection refused');

        $this->postJson(route('admin.failed-jobs.retry', $uuids[0]))->assertNoContent();
        $this->deleteJson(route('admin.failed-jobs.destroy', $uuids[1]))->assertNoContent();
        $this->deleteJson(route('admin.failed-jobs.destroy', $uuids[1]))->assertNotFound();

        $this->assertSame(0, DB::table('failed_jobs')->count());
        // Retrying puts it back on the queue.
        $this->assertSame(1, DB::table('jobs')->count());
    }
}
