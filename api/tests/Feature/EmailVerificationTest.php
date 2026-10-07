<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\EmailAddressChanged;
use App\Notifications\VerifyEmailAddress;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
        $this->withHeader('Origin', config('app.frontend_url'));
    }

    public function test_signing_up_sends_a_confirmation_link_but_blocks_nothing(): void
    {
        $this->postJson(route('auth.register'), [
            'first_name' => 'Holly',
            'last_name' => 'Berry',
            'email' => 'holly@example.com',
            'password' => 'a-long-test-password',
            'password_confirmation' => 'a-long-test-password',
        ])->assertCreated();

        $holly = User::where('email', 'holly@example.com')->firstOrFail();
        $this->assertFalse($holly->hasVerifiedEmail());
        Notification::assertSentTo($holly, VerifyEmailAddress::class, fn (VerifyEmailAddress $notification) => str_contains(
            (string) $notification->toMail($holly)->actionUrl,
            '/api/auth/email/verify/'.$holly->id.'/',
        ));

        // A nudge, not a wall: the rest of the app works straight away.
        $this->getJson(route('session'))->assertJsonPath('user.email_verified_at', null);
        $this->postJson(route('groups.store'), ['name' => 'Ski Trip'])->assertCreated();
    }

    public function test_the_link_confirms_the_email_without_being_signed_in(): void
    {
        Event::fake([Verified::class]);
        $holly = User::factory()->unverified()->create();

        $this->get(VerifyEmailAddress::url($holly))
            ->assertRedirect(config('app.frontend_url').'/email-verified?status=confirmed');

        $this->assertTrue($holly->fresh()?->hasVerifiedEmail());
        Event::assertDispatched(Verified::class);
    }

    public function test_tampered_expired_and_out_of_date_links_do_nothing(): void
    {
        $holly = User::factory()->unverified()->create(['email' => 'holly@example.com']);
        $link = VerifyEmailAddress::url($holly);
        $expired = config('app.frontend_url').'/email-verified?status=expired';

        $this->get(str_replace('/verify/'.$holly->id.'/', '/verify/'.($holly->id + 1).'/', $link))->assertNotFound();
        $this->get($link.'x')->assertRedirect($expired);

        // A link to an address they've since changed away from.
        $holly->update(['email' => 'holly.berry@example.com']);
        $this->get($link)->assertRedirect($expired);

        // A day later, even a link for the current address has run out.
        $current = VerifyEmailAddress::url($holly);
        $this->travel(25)->hours();
        $this->get($current)->assertRedirect($expired);

        $this->assertFalse($holly->fresh()?->hasVerifiedEmail());
    }

    public function test_resending_only_sends_when_unconfirmed_and_is_throttled(): void
    {
        $holly = User::factory()->unverified()->create();
        Sanctum::actingAs($holly);

        $this->postJson(route('auth.email.resend'))->assertStatus(202);
        $this->postJson(route('auth.email.resend'))->assertStatus(202);
        $this->postJson(route('auth.email.resend'))->assertStatus(202);
        $this->postJson(route('auth.email.resend'))->assertTooManyRequests();
        Notification::assertSentToTimes($holly, VerifyEmailAddress::class, 3);

        Sanctum::actingAs($verified = User::factory()->create());
        $this->postJson(route('auth.email.resend'))->assertOk();
        Notification::assertNotSentTo($verified, VerifyEmailAddress::class);
    }

    public function test_changing_your_email_needs_the_new_one_confirmed_and_tells_the_old_one(): void
    {
        $holly = User::factory()->create(['email' => 'holly@example.com']);
        Sanctum::actingAs($holly);

        $this->patchJson(route('account.profile'), [
            'first_name' => $holly->first_name,
            'last_name' => $holly->last_name,
            'email' => 'holly.berry@example.com',
            'current_password' => 'password',
        ])->assertOk()->assertJsonPath('email_verified_at', null);

        Notification::assertSentTo($holly, VerifyEmailAddress::class);
        Notification::assertSentTo(new AnonymousNotifiable, EmailAddressChanged::class, fn ($notification, $channels, AnonymousNotifiable $notifiable) => $notifiable->routes['mail'] === 'holly@example.com');

        // Saving a name alone leaves the confirmed email alone.
        $holly->forceFill(['email_verified_at' => now()])->save();
        $this->patchJson(route('account.profile'), ['first_name' => 'Hol', 'last_name' => 'Berry', 'email' => 'holly.berry@example.com'])->assertOk();
        $this->assertTrue($holly->fresh()?->hasVerifiedEmail());
    }

    public function test_the_admin_fixing_an_email_sends_a_new_link_and_sees_who_is_unconfirmed(): void
    {
        config(['app.admin_email' => 'owner@example.com']);
        $admin = User::factory()->create(['email' => 'owner@example.com']);
        $typo = User::factory()->create(['email' => 'holly@gmial.com']);
        Sanctum::actingAs($admin);

        $this->patchJson(route('admin.accounts.update', $typo), ['first_name' => 'Holly', 'last_name' => 'Berry', 'email' => 'holly@gmail.com'])->assertOk();

        Notification::assertSentTo($typo, VerifyEmailAddress::class);
        Notification::assertNotSentTo(new AnonymousNotifiable, EmailAddressChanged::class);
        $accounts = $this->getJson(route('admin.accounts.index'))->collect();
        $this->assertFalse($accounts->firstWhere('id', $typo->id)['email_verified']);
        $this->assertTrue($accounts->firstWhere('id', $admin->id)['email_verified']);
    }

    public function test_accounts_from_before_verification_count_as_confirmed(): void
    {
        $old = User::factory()->unverified()->create(['created_at' => now()->subMonth()]);
        $kid = User::factory()->unverified()->create(['managed_kind' => 'child']);

        $migration = require database_path('migrations/2026_10_07_211007_mark_existing_accounts_verified.php');
        $migration->up();

        $this->assertTrue($old->fresh()?->hasVerifiedEmail());
        $this->assertEquals($old->created_at, $old->fresh()->email_verified_at);
        $this->assertNull($kid->fresh()?->email_verified_at);
    }
}
