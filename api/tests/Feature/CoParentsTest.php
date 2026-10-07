<?php

namespace Tests\Feature;

use App\Actions\ManagedProfiles\CreateManagedProfile;
use App\Models\Group;
use App\Models\User;
use App\Models\WishlistItem;
use App\Notifications\EmptyWishlistReminder;
use App\Notifications\ProfileShared;
use App\Notifications\SantaMessageReceived;
use App\Notifications\SecretSantaAssigned;
use App\Notifications\ShoppingReminder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CoParentsTest extends TestCase
{
    use RefreshDatabase;

    private User $holly;

    private User $nick;

    private User $lily;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
        $this->holly = User::factory()->create(['first_name' => 'Holly', 'email' => 'holly@example.test']);
        $this->nick = User::factory()->create(['first_name' => 'Nick', 'email' => 'nick@example.test']);
        Group::factory()->create(['owner_id' => $this->holly->id])->members()->attach($this->nick);
        $this->lily = app(CreateManagedProfile::class)($this->holly, 'Lily', null, 'child');
    }

    public function test_a_parent_shares_their_kid_with_someone_from_their_groups(): void
    {
        Sanctum::actingAs($this->holly);

        $this->postJson(route('account.profiles.managers.store', $this->lily), ['user_id' => $this->nick->id])
            ->assertOk()
            ->assertJsonPath('managers.0.name', $this->holly->full_name)
            ->assertJsonPath('managers.1.name', $this->nick->full_name);

        $this->assertTrue($this->nick->manages($this->lily));
        Notification::assertSentTo($this->nick, ProfileShared::class, function (ProfileShared $notification) {
            $mail = $notification->toMail($this->nick);

            return $mail->subject === "{$this->holly->full_name} shared Lily's Secret Santa list with you"
                && str_ends_with($mail->actionUrl, "/wishlist?for={$this->lily->id}");
        });

        Sanctum::actingAs($this->nick);
        $this->getJson(route('account.profiles.index'))->assertJsonPath('0.name', 'Lily');
    }

    public function test_deleting_your_account_takes_the_kids_only_you_look_after(): void
    {
        // Biscuit is shared with Nick, so he stays; Lily is Holly's alone, so she goes too.
        $biscuit = app(CreateManagedProfile::class)($this->holly, 'Biscuit', null, 'pet');
        $biscuit->managers()->attach($this->nick);
        $nicksGroup = Group::factory()->create(['owner_id' => $this->nick->id]);
        $nicksGroup->members()->attach([$this->lily->id, $biscuit->id]);
        $lilysItem = WishlistItem::factory()->for($this->lily, 'owner')->create();

        Sanctum::actingAs($this->holly);
        $this->deleteJson(route('account.destroy'), ['current_password' => 'password'])->assertNoContent();

        $this->assertModelMissing($this->holly);
        $this->assertModelMissing($this->lily);
        $this->assertModelMissing($lilysItem);
        $this->assertModelExists($biscuit);
        $this->assertTrue($this->nick->manages($biscuit));
        $this->assertEqualsCanonicalizing([$this->nick->id, $biscuit->id], $nicksGroup->members()->pluck('users.id')->all());
    }

    public function test_only_people_from_your_groups_only_once_and_only_by_a_parent(): void
    {
        $stranger = User::factory()->create();
        $biscuit = app(CreateManagedProfile::class)($this->holly, 'Biscuit', null, 'pet');
        Sanctum::actingAs($this->holly);

        $this->postJson(route('account.profiles.managers.store', $this->lily), ['user_id' => $stranger->id])
            ->assertJsonValidationErrors(['user_id' => 'one of your groups']);
        $this->postJson(route('account.profiles.managers.store', $this->lily), ['user_id' => $biscuit->id])
            ->assertJsonValidationErrors('user_id');
        $this->postJson(route('account.profiles.managers.store', $this->lily), ['user_id' => $this->holly->id])
            ->assertJsonValidationErrors(['user_id' => 'already looks after']);

        Sanctum::actingAs($this->nick);
        $this->postJson(route('account.profiles.managers.store', $this->lily), ['user_id' => $this->nick->id])->assertForbidden();
    }

    public function test_parents_can_step_back_but_someone_always_looks_after_the_kid(): void
    {
        $this->lily->managers()->attach($this->nick);
        Sanctum::actingAs($this->nick);

        $this->deleteJson(route('account.profiles.managers.destroy', [$this->lily, $this->nick]))->assertNoContent();
        $this->assertFalse($this->lily->managers()->whereKey($this->nick->id)->exists());

        Sanctum::actingAs($this->holly);
        $this->deleteJson(route('account.profiles.managers.destroy', [$this->lily, $this->holly]))
            ->assertJsonValidationErrors(['manager' => 'needs someone looking after them']);
    }

    public function test_a_kids_emails_reach_each_parent_who_wants_them(): void
    {
        $this->lily->managers()->attach($this->nick);
        $assignment = new SecretSantaAssigned(Group::factory()->make(), $this->nick, 1);
        $chat = new SantaMessageReceived(1, 1, 'Swap', true, 'Lily');

        $this->assertSame(['holly@example.test', 'nick@example.test'], $this->lily->routeNotificationForMail($assignment));

        $this->nick->update(['email_preferences' => ['santa_chat' => false]]);
        $this->assertSame(['holly@example.test'], $this->lily->routeNotificationForMail($chat));
        $this->assertSame(['holly@example.test', 'nick@example.test'], $this->lily->routeNotificationForMail($assignment));
    }

    public function test_emails_about_a_kid_are_worded_for_the_parent_reading_them(): void
    {
        $text = fn ($mail) => $mail->subject.' | '.$mail->greeting.' | '.implode(' ', [...$mail->introLines, ...$mail->outroLines]);

        $assigned = $text((new SecretSantaAssigned(Group::factory()->make(['name' => 'Swap']), $this->nick, 1))->toMail($this->lily));
        $this->assertStringContainsString("🎁 Lily's Secret Santa assignment for Swap", $assigned);
        $this->assertStringContainsString("Lily's Secret Santa for Swap", (new SecretSantaAssigned(Group::factory()->make(['name' => 'Swap']), $this->nick, 3))->toMail($this->lily)->subject);
        $this->assertStringContainsString("Hi! Here's an update about Lily.", $assigned);
        $this->assertStringContainsString('Lily is the Secret Santa for', $assigned);
        $this->assertStringContainsString('you look after Lily and Secret Santa assignment emails are on', $assigned);

        $empty = (new EmptyWishlistReminder('Swap', 'Sunday, December 20', 21))->toMail($this->lily);
        $this->assertStringContainsString("Lily's wishlist is still empty", $text($empty));
        $this->assertStringEndsWith("/wishlist?for={$this->lily->id}", (string) $empty->actionUrl);

        $chat = $text((new SantaMessageReceived(1, 1, 'Swap', true, 'Lily', $this->lily->id))->toMail($this->lily));
        $this->assertStringContainsString("Lily's Secret Santa sent a message in Swap", $chat);
        $this->assertStringContainsString("Lily's Secret Santa in **Swap** has a question for Lily!", $chat);

        $reply = $text((new SantaMessageReceived(1, 1, 'Swap', false, 'Nick', $this->lily->id))->toMail($this->lily));
        $this->assertStringContainsString('Nick wrote back to Lily', $reply);
        $this->assertStringContainsString("Nick still has no idea it's Lily.", $reply);

        $shopping = $text((new ShoppingReminder('Swap', 'Sunday, December 20', 14, null, $this->nick->id, 'Nick', 2, ['A', 'B'], 1, 3))->toMail($this->lily));
        $this->assertStringContainsString('Lily is the Secret Santa for **Nick**', $shopping);
        $this->assertStringContainsString('Lily drew Nick in 2 groups', $shopping);
        $this->assertStringContainsString('1 claimed so far', $shopping);

        // Adults are still "you".
        $this->assertStringContainsString("You're the Secret Santa for", $text((new SecretSantaAssigned(Group::factory()->make(), $this->nick, 1))->toMail($this->holly)));
    }
}
