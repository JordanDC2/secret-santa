<?php

namespace Tests\Feature;

use App\Actions\Account\DeleteAccount;
use App\Actions\ManagedProfiles\CreateManagedProfile;
use App\Enums\EmailKind;
use App\Models\Group;
use App\Models\User;
use App\Notifications\SantaMessageReceived;
use App\Notifications\SecretSantaAssigned;
use App\Notifications\ShoppingReminder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use NotificationChannels\WebPush\WebPushChannel;
use Tests\TestCase;

class PushNotificationsTest extends TestCase
{
    use RefreshDatabase;

    private const DEVICE = [
        'endpoint' => 'https://fcm.googleapis.com/fcm/send/device-1',
        'keys' => ['p256dh' => 'BPublicKeyFromTheBrowser', 'auth' => 'AuthSecret'],
        'content_encoding' => 'aes128gcm',
    ];

    public function test_a_device_can_be_turned_on_moved_and_turned_off(): void
    {
        $holly = User::factory()->create();
        Sanctum::actingAs($holly);

        $this->postJson(route('account.push-subscriptions.store'), ['endpoint' => 'http://not-https.example'] + self::DEVICE)
            ->assertJsonValidationErrors('endpoint');
        $this->postJson(route('account.push-subscriptions.store'), self::DEVICE)->assertNoContent();
        $this->assertSame(1, $holly->pushSubscriptions()->count());

        // Someone else signs in on the same browser: the device follows them.
        $nick = User::factory()->create();
        Sanctum::actingAs($nick);
        $this->postJson(route('account.push-subscriptions.store'), self::DEVICE)->assertNoContent();
        $this->assertSame(0, $holly->pushSubscriptions()->count());
        $this->assertSame(1, $nick->pushSubscriptions()->count());

        $this->deleteJson(route('account.push-subscriptions.destroy'), ['endpoint' => self::DEVICE['endpoint']])->assertNoContent();
        $this->assertSame(0, $nick->pushSubscriptions()->count());
    }

    public function test_push_only_goes_to_people_with_a_device_who_want_that_kind(): void
    {
        $group = Group::factory()->create();
        $holly = User::factory()->create();
        $notification = new SecretSantaAssigned($group, User::factory()->create());

        $this->assertSame(['mail'], $notification->via($holly));

        $holly->updatePushSubscription(self::DEVICE['endpoint'], 'key', 'token');
        $this->assertSame(['mail', WebPushChannel::class], $notification->via($holly));

        // Email and push are switched separately.
        $holly->update(['email_preferences' => [EmailKind::Assignments->value => false]]);
        $this->assertSame([WebPushChannel::class], $notification->via($holly->fresh() ?? $holly));
        $holly->update(['push_preferences' => [EmailKind::Assignments->value => false]]);
        $this->assertSame([], $notification->via($holly->fresh() ?? $holly));
    }

    public function test_a_kids_pushes_go_to_each_parent_who_wants_them(): void
    {
        $holly = User::factory()->create();
        $nick = User::factory()->create();
        $lily = app(CreateManagedProfile::class)($holly, 'Lily', null, 'child');
        $lily->managers()->attach($nick);
        $holly->updatePushSubscription('https://push.example/holly', 'key', 'token');
        $nick->updatePushSubscription('https://push.example/nick', 'key', 'token');
        $nick->update(['push_preferences' => [EmailKind::Assignments->value => false]]);

        $devices = $lily->routeNotificationForWebPush(new SecretSantaAssigned(Group::factory()->create(), $holly));

        $this->assertSame(['https://push.example/holly'], $devices->pluck('endpoint')->all());
    }

    public function test_every_chat_message_is_pushed_but_only_the_first_unread_is_emailed(): void
    {
        Notification::fake();
        $group = Group::factory()->create(['drawn_at' => now()]);
        $santa = $group->owner;
        $person = User::factory()->create();
        $group->members()->attach($person);
        $group->assignments()->create(['draw_number' => 1, 'giver_id' => $santa->id, 'receiver_id' => $person->id]);
        $group->assignments()->create(['draw_number' => 1, 'giver_id' => $person->id, 'receiver_id' => $santa->id]);
        $person->updatePushSubscription(self::DEVICE['endpoint'], 'key', 'token');

        Sanctum::actingAs($santa);
        $this->postJson(route('groups.santa-chat.store', [$group, 'my-person']), ['body' => 'One'])->assertNoContent();
        $this->postJson(route('groups.santa-chat.store', [$group, 'my-person']), ['body' => 'Two'])->assertNoContent();

        $sent = Notification::sent($person, SantaMessageReceived::class);
        $this->assertCount(2, $sent);
        $this->assertSame(['mail', WebPushChannel::class], $sent[0]->via($person));
        $this->assertSame([WebPushChannel::class], $sent[1]->via($person));
    }

    public function test_pushes_never_name_who_someone_is_buying_for(): void
    {
        $group = Group::factory()->create(['name' => 'Ski Trip']);
        $santa = User::factory()->create();
        $person = User::factory()->create(['first_name' => 'Polly', 'last_name' => 'Person']);

        $pushes = [
            (new SecretSantaAssigned($group, $person))->toWebPush($santa),
            (new ShoppingReminder('Ski Trip', 'Friday, December 20', 10, null, $person->id, $person->full_name, 1, ['Ski Trip'], 0, 3))->toWebPush($santa),
            (new SantaMessageReceived(1, $group->id, 'Ski Trip', false, $person->full_name))->toWebPush($santa),
        ];

        foreach ($pushes as $push) {
            $this->assertStringNotContainsString('Polly', json_encode($push->toArray(), JSON_THROW_ON_ERROR));
        }
        $this->assertSame('/?group='.$group->id.'&chat=my-person', $pushes[2]->toArray()['data']['url']);
        // Android's status bar shows the Santa hat badge, not the browser's bell.
        $this->assertSame('/badge-96.png', $pushes[0]->toArray()['badge']);
    }

    public function test_push_switches_are_saved_separately_from_email(): void
    {
        Sanctum::actingAs($holly = User::factory()->create());

        $this->patchJson(route('account.push-preferences.update'), ['santa_chat' => false])
            ->assertOk()
            ->assertJsonPath('santa_chat', false)
            ->assertJsonPath('assignments', true);

        $this->getJson(route('account.email-preferences.show'))->assertJsonPath('santa_chat', true);
        $this->assertFalse($holly->fresh()?->wantsPush(EmailKind::SantaChat));
    }

    public function test_deleting_an_account_forgets_its_devices(): void
    {
        $holly = User::factory()->create();
        $holly->updatePushSubscription(self::DEVICE['endpoint'], 'key', 'token');

        app(DeleteAccount::class)($holly);

        $this->assertDatabaseCount('push_subscriptions', 0);
    }
}
