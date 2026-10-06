<?php

namespace Tests\Feature;

use App\Models\Group;
use App\Models\User;
use App\Notifications\ElfMailMessage;
use App\Notifications\MemberJoinedGroup;
use App\Notifications\NewAccountRegistered;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\JsonResponse;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Notification;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OwnerAndAdminEmailsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
        // Registering starts a session, which Sanctum only does for the SPA's own origin.
        $this->withHeader('Origin', config('app.frontend_url'));
    }

    public function test_the_admin_hears_about_each_new_account(): void
    {
        config(['app.admin_email' => 'organizer@example.test']);

        $this->register('Tinsel', 'tinsel@example.test')->assertSuccessful();

        Notification::assertSentOnDemand(
            NewAccountRegistered::class,
            function (NewAccountRegistered $notification, array $channels, AnonymousNotifiable $notifiable) {
                $mail = $notification->toMail($notifiable);

                return $notifiable->routes['mail'] === 'organizer@example.test'
                    && $mail->subject === '🎅 New elf on the list: Tinsel Sparkle'
                    // The body is Markdown, so typed text arrives escaped ("tinsel@example\\.test").
                    && str_contains(implode(' ', $mail->introLines), ElfMailMessage::plain('tinsel@example.test'));
            },
        );
    }

    public function test_no_admin_email_is_sent_when_none_is_configured(): void
    {
        config(['app.admin_email' => null]);

        $this->register('Tinsel', 'tinsel@example.test')->assertSuccessful();

        Notification::assertNothingSent();
    }

    public function test_the_owner_hears_when_someone_joins_their_group(): void
    {
        $group = Group::factory()->create(['name' => 'Cousins']);
        $joiner = User::factory()->create(['first_name' => 'Ivy']);
        Sanctum::actingAs($joiner);

        $this->postJson(route('groups.join'), ['join_code' => $group->join_code])->assertSuccessful();

        Notification::assertSentTo($group->owner, MemberJoinedGroup::class, function (MemberJoinedGroup $notification) use ($group) {
            $mail = $notification->toMail($group->owner);

            return $notification->member->first_name === 'Ivy'
                && $notification->membersCount === 2
                && $mail->subject === '🎄 Ivy joined Cousins';
        });
        Notification::assertNotSentTo($joiner, MemberJoinedGroup::class);
    }

    public function test_a_refused_join_emails_nobody(): void
    {
        $group = Group::factory()->create(['drawn_at' => now()]);
        Sanctum::actingAs(User::factory()->create());

        $this->postJson(route('groups.join'), ['join_code' => $group->join_code])->assertUnprocessable();

        Notification::assertNothingSent();
    }

    /**
     * @return TestResponse<JsonResponse>
     */
    private function register(string $name, string $email): TestResponse
    {
        return $this->postJson(route('auth.register'), [
            'first_name' => $name,
            'last_name' => 'Sparkle',
            'email' => $email,
            'password' => 'a-long-test-password-1',
            'password_confirmation' => 'a-long-test-password-1',
        ]);
    }
}
