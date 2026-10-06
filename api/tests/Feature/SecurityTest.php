<?php

namespace Tests\Feature;

use App\Models\Group;
use App\Models\User;
use App\Notifications\SecretSantaAssigned;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Look like the React app so Sanctum starts a session, as it does for login/register.
        $this->withHeader('Origin', config('app.frontend_url'));
    }

    public function test_login_is_rate_limited_per_email(): void
    {
        $user = User::factory()->create();

        for ($i = 0; $i < 5; $i++) {
            $this->postJson(route('auth.login'), ['email' => $user->email, 'password' => 'wrong'])->assertUnprocessable();
        }

        $this->postJson(route('auth.login'), ['email' => $user->email, 'password' => 'password'])->assertTooManyRequests();
    }

    public function test_joining_by_code_is_rate_limited(): void
    {
        Sanctum::actingAs(User::factory()->create());

        for ($i = 0; $i < 10; $i++) {
            $this->postJson(route('groups.join'), ['join_code' => 'NOPE'.$i])->assertUnprocessable();
        }

        $this->postJson(route('groups.join'), ['join_code' => 'NOPE99'])->assertTooManyRequests();
    }

    public function test_registration_is_rate_limited(): void
    {
        for ($i = 0; $i < 10; $i++) {
            $this->postJson(route('auth.register'), [
                'first_name' => "Elf {$i}",
                'last_name' => 'Workshop',
                'email' => "elf{$i}@example.com",
                'password' => 'jingle-bells-123',
                'password_confirmation' => 'jingle-bells-123',
            ])->assertSuccessful();
            $this->app['auth']->forgetGuards();
        }

        $this->postJson(route('auth.register'), [
            'name' => 'One too many',
            'email' => 'extra@example.com',
            'password' => 'jingle-bells-123',
            'password_confirmation' => 'jingle-bells-123',
        ])->assertTooManyRequests();
    }

    public function test_names_cannot_be_drawn_twice(): void
    {
        Notification::fake();
        $group = Group::factory()->create();
        $group->members()->attach(User::factory()->count(2)->create());
        Sanctum::actingAs($group->owner);

        $this->postJson(route('groups.draw', $group))->assertOk();
        $firstDraw = $group->assignments()->pluck('receiver_id', 'giver_id')->all();

        $this->postJson(route('groups.draw', $group))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['group' => 'already been drawn']);

        $this->assertSame($firstDraw, $group->assignments()->pluck('receiver_id', 'giver_id')->all());
        Notification::assertCount(3);
    }

    public function test_names_in_emails_cannot_become_links(): void
    {
        Notification::fake();
        $group = Group::factory()->create(['name' => '[Group](https://evil.example/group)']);
        $group->members()->attach(User::factory()->create(['first_name' => '[Free gift](https://evil.example/gift)']));
        Sanctum::actingAs($group->owner);

        $this->postJson(route('groups.draw', $group))->assertOk();

        Notification::assertSentTo($group->owner, SecretSantaAssigned::class, function (SecretSantaAssigned $notification) use ($group) {
            $html = (string) $notification->toMail($group->owner)->render();

            return ! str_contains($html, 'href="https://evil.example');
        });
    }

    public function test_changing_your_password_signs_out_your_other_sessions(): void
    {
        config(['session.driver' => 'database']);
        $user = User::factory()->create();
        $stranger = User::factory()->create();
        $this->insertSession('elsewhere', $user);
        $this->insertSession('someone-else', $stranger);
        Sanctum::actingAs($user);

        $this->putJson(route('account.password'), [
            'current_password' => 'password',
            'password' => 'brand-new-pass-1',
            'password_confirmation' => 'brand-new-pass-1',
        ])->assertNoContent();

        $this->assertDatabaseMissing('sessions', ['id' => 'elsewhere']);
        $this->assertDatabaseHas('sessions', ['id' => 'someone-else']);
    }

    public function test_resetting_your_password_signs_out_every_session(): void
    {
        config(['session.driver' => 'database']);
        $user = User::factory()->create();
        $this->insertSession('intruder', $user);

        $this->postJson(route('auth.password.update'), [
            'token' => Password::createToken($user),
            'email' => $user->email,
            'password' => 'brand-new-pass-1',
            'password_confirmation' => 'brand-new-pass-1',
        ])->assertOk();

        $this->assertDatabaseMissing('sessions', ['id' => 'intruder']);
    }

    public function test_emails_are_case_insensitive(): void
    {
        $this->postJson(route('auth.register'), [
            'first_name' => 'Holly',
            'last_name' => 'Berry',
            'email' => '  Holly@Example.COM ',
            'password' => 'jingle-bells-123',
            'password_confirmation' => 'jingle-bells-123',
        ])->assertSuccessful()->assertJsonPath('email', 'holly@example.com');
        $this->app['auth']->forgetGuards();

        $this->postJson(route('auth.register'), [
            'first_name' => 'Holly',
            'last_name' => 'Again',
            'email' => 'HOLLY@example.com',
            'password' => 'jingle-bells-123',
            'password_confirmation' => 'jingle-bells-123',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');

        $this->postJson(route('auth.login'), ['email' => 'HoLLy@example.com', 'password' => 'jingle-bells-123'])->assertOk();
    }

    private function insertSession(string $id, User $user): void
    {
        DB::table('sessions')->insert([
            'id' => $id,
            'user_id' => $user->id,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'test',
            'payload' => '',
            'last_activity' => now()->timestamp,
        ]);
    }
}
