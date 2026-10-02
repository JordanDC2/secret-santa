<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\ResetPasswordLink;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\SendQueuedNotifications;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class ResetPasswordTest extends TestCase
{
    use RefreshDatabase;

    public function test_requesting_a_reset_emails_a_link_to_the_react_app(): void
    {
        Notification::fake();
        $user = User::factory()->create();

        $this->postJson(route('auth.password.email'), ['email' => $user->email])->assertOk();

        Notification::assertSentTo($user, ResetPasswordLink::class, function (ResetPasswordLink $notification) use ($user) {
            $url = $notification->toMail($user)->actionUrl;

            return str_starts_with($url, config('app.frontend_url').'/reset-password?')
                && str_contains($url, 'token='.$notification->token)
                && str_contains($url, 'email='.urlencode($user->email));
        });
    }

    public function test_reset_emails_are_queued(): void
    {
        Queue::fake();
        $user = User::factory()->create();

        $this->postJson(route('auth.password.email'), ['email' => $user->email])->assertOk();

        Queue::assertPushed(SendQueuedNotifications::class, 1);
    }

    public function test_unknown_email_gets_the_same_response_as_a_known_one(): void
    {
        Notification::fake();
        $user = User::factory()->create();

        $known = $this->postJson(route('auth.password.email'), ['email' => $user->email]);
        $unknown = $this->postJson(route('auth.password.email'), ['email' => 'nobody@example.com']);

        $unknown->assertOk();
        $this->assertSame($known->json(), $unknown->json());
        Notification::assertCount(1);
    }

    public function test_valid_token_changes_the_password(): void
    {
        $user = User::factory()->create();
        $token = Password::createToken($user);

        $this->postJson(route('auth.password.update'), [
            'token' => $token,
            'email' => $user->email,
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ])->assertOk();

        $this->assertTrue(Hash::check('new-password-123', $user->fresh()->password));
    }

    public function test_token_can_only_be_used_once(): void
    {
        $user = User::factory()->create();
        $token = Password::createToken($user);
        $payload = [
            'token' => $token,
            'email' => $user->email,
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ];

        $this->postJson(route('auth.password.update'), $payload)->assertOk();
        $this->postJson(route('auth.password.update'), $payload)->assertUnprocessable();
    }

    public function test_invalid_token_is_rejected_and_password_is_unchanged(): void
    {
        $user = User::factory()->create();

        $this->postJson(route('auth.password.update'), [
            'token' => 'not-a-real-token',
            'email' => $user->email,
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');

        $this->assertTrue(Hash::check('password', $user->fresh()->password));
    }

    public function test_mismatched_confirmation_is_rejected(): void
    {
        $user = User::factory()->create();

        $this->postJson(route('auth.password.update'), [
            'token' => Password::createToken($user),
            'email' => $user->email,
            'password' => 'new-password-123',
            'password_confirmation' => 'something-else',
        ])->assertUnprocessable()->assertJsonValidationErrors('password');
    }
}
