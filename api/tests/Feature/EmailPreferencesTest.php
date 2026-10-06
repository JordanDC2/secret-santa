<?php

namespace Tests\Feature;

use App\Enums\EmailKind;
use App\Models\Group;
use App\Models\User;
use App\Notifications\ClaimNudged;
use App\Notifications\ElfMailMessage;
use App\Notifications\SantaMessageReceived;
use App\Notifications\SecretSantaAssigned;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EmailPreferencesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
    }

    public function test_every_optional_email_starts_on(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson(route('account.email-preferences.show'))->assertOk()->assertExactJson([
            'assignments' => true,
            'santa_chat' => true,
            'reminders' => true,
            'nudges' => true,
            'gift_ideas' => true,
            'new_members' => true,
            'exchange_updates' => true,
        ]);
    }

    public function test_turning_one_off_leaves_the_rest_on(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->patchJson(route('account.email-preferences.update'), ['santa_chat' => false, 'made_up' => false])
            ->assertOk()
            ->assertJsonPath('santa_chat', false)
            ->assertJsonPath('reminders', true)
            ->assertJsonMissingPath('made_up');
        $this->patchJson(route('account.email-preferences.update'), ['nudges' => false])->assertOk();

        $user->refresh();
        $this->assertFalse($user->wantsEmail(EmailKind::SantaChat));
        $this->assertFalse($user->wantsEmail(EmailKind::Nudges));
        $this->assertTrue($user->wantsEmail(EmailKind::Assignments));
        // Never leaks into the signed-in user's own details.
        $this->getJson('/api/user')->assertJsonMissingPath('email_preferences');
    }

    public function test_switches_must_be_on_or_off_and_need_a_signed_in_user(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->patchJson(route('account.email-preferences.update'), ['reminders' => 'sometimes'])
            ->assertJsonValidationErrors('reminders');

        $this->app['auth']->forgetGuards();
        $this->getJson(route('account.email-preferences.show'))->assertUnauthorized();
    }

    public function test_an_email_someone_turned_off_isnt_sent(): void
    {
        $group = Group::factory()->create();
        $friend = User::factory()->create(['email_preferences' => ['assignments' => false]]);
        $group->members()->attach($friend);
        Sanctum::actingAs($group->owner);

        $this->postJson(route('groups.draw', $group))->assertOk();

        Notification::assertSentTo($group->owner, SecretSantaAssigned::class);
        Notification::assertNotSentTo($friend, SecretSantaAssigned::class);
    }

    public function test_turning_off_santa_chat_still_keeps_the_unread_count(): void
    {
        $group = Group::factory()->create(['drawn_at' => now()]);
        $person = User::factory()->create(['email_preferences' => ['santa_chat' => false]]);
        $group->members()->attach($person);
        $group->assignments()->create(['draw_number' => 1, 'giver_id' => $group->owner_id, 'receiver_id' => $person->id]);
        $group->assignments()->create(['draw_number' => 1, 'giver_id' => $person->id, 'receiver_id' => $group->owner_id]);
        Sanctum::actingAs($group->owner);

        $this->postJson(route('groups.santa-chat.store', [$group, 'my-person']), ['body' => 'Hi!'])->assertNoContent();

        Notification::assertNotSentTo($person, SantaMessageReceived::class);
        Sanctum::actingAs($person);
        $this->getJson(route('groups.show', $group))->assertJsonPath('my_santa.unread_messages', 1);
    }

    public function test_optional_emails_end_with_a_link_to_the_settings(): void
    {
        $claimer = User::factory()->create();
        $mail = (new ClaimNudged(1, 'Ivy', 'Reading lamp', null, null))->toMail($claimer);

        $this->assertStringContainsString("You're getting this because nudge emails are on.", implode(' ', $mail->outroLines));
        $this->assertStringContainsString('/account)', implode(' ', $mail->outroLines));
    }

    public function test_every_email_kind_has_a_label(): void
    {
        foreach (EmailKind::cases() as $kind) {
            $this->assertNotSame('', $kind->label());
            $this->assertStringContainsString($kind->label(), implode(' ', (new ElfMailMessage)->settingsFooter($kind)->introLines));
        }
    }
}
