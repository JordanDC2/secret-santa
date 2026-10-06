<?php

namespace Tests\Feature;

use App\Actions\Groups\SendExchangeReminders;
use App\Actions\ManagedProfiles\CreateManagedProfile;
use App\Events\SantaChatChanged;
use App\Models\Group;
use App\Models\User;
use App\Models\WishlistItem;
use App\Notifications\SantaMessageReceived;
use App\Notifications\ShoppingReminder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class KidsInGroupsTest extends TestCase
{
    use RefreshDatabase;

    private Group $group;

    private User $parent;

    private User $lily;

    private User $nick;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
        Event::fake([SantaChatChanged::class]);

        $this->parent = User::factory()->create(['name' => 'Holly', 'email' => 'holly@example.test']);
        $this->nick = User::factory()->create(['name' => 'Nick']);
        $this->group = Group::factory()->create(['name' => 'Family Swap', 'owner_id' => $this->parent->id]);
        $this->group->members()->attach($this->nick);
        $this->lily = app(CreateManagedProfile::class)($this->parent, 'Lily', 'child');
    }

    public function test_a_parent_adds_their_kid_to_a_group_and_everyone_sees_her(): void
    {
        Sanctum::actingAs($this->parent);
        $this->postJson(route('groups.profiles.store', $this->group), ['profile_id' => $this->lily->id])->assertNoContent();

        $this->getJson(route('groups.show', $this->group))
            ->assertJsonPath('members_count', 3)
            ->assertJsonPath('members.2.name', 'Lily')
            ->assertJsonPath('members.2.kind', 'child')
            ->assertJsonPath('members.2.managed_by_me', true);

        Sanctum::actingAs($this->nick);
        $this->getJson(route('groups.show', $this->group))->assertJsonPath('members.2.managed_by_me', false);
        $this->getJson(route('users.wishlist', $this->lily))->assertOk();
    }

    public function test_only_your_own_kids_only_in_your_groups_only_before_the_draw(): void
    {
        $otherGroup = Group::factory()->create();
        Sanctum::actingAs($this->parent);

        $this->postJson(route('groups.profiles.store', $otherGroup), ['profile_id' => $this->lily->id])->assertForbidden();
        $this->postJson(route('groups.profiles.store', $this->group), ['profile_id' => $this->nick->id])->assertForbidden();
        $this->postJson(route('groups.profiles.store', $this->group), ['profile_id' => $this->lily->id])->assertNoContent();
        $this->postJson(route('groups.profiles.store', $this->group), ['profile_id' => $this->lily->id])
            ->assertJsonValidationErrors(['profile_id' => 'already in']);

        Sanctum::actingAs($this->nick);
        $this->deleteJson(route('groups.profiles.destroy', [$this->group, $this->lily]))->assertForbidden();

        Sanctum::actingAs($this->parent);
        $this->deleteJson(route('groups.profiles.destroy', [$this->group, $this->lily]))->assertNoContent();
        $this->assertFalse($this->group->members()->whereKey($this->lily->id)->exists());

        $this->group->update(['drawn_at' => now()]);
        $this->postJson(route('groups.profiles.store', $this->group), ['profile_id' => $this->lily->id])
            ->assertJsonValidationErrors(['profile_id' => 'already been drawn']);
    }

    public function test_kids_leave_with_their_parent_unless_a_co_parent_stays(): void
    {
        $biscuit = app(CreateManagedProfile::class)($this->nick, 'Biscuit', 'pet');
        $biscuit->managers()->attach($this->parent);
        $this->group->members()->attach([$this->lily->id, $biscuit->id]);

        Sanctum::actingAs($this->nick);
        $this->postJson(route('groups.leave', $this->group))->assertNoContent();

        // Biscuit stays: Holly looks after him too and is still here. Lily was never Nick's.
        $this->assertTrue($this->group->members()->whereKey($biscuit->id)->exists());
        $this->assertTrue($this->group->members()->whereKey($this->lily->id)->exists());

        $other = Group::factory()->create();
        $other->members()->attach([$this->parent->id, $this->lily->id]);
        Sanctum::actingAs($this->parent);
        $this->postJson(route('groups.leave', $other))->assertNoContent();
        $this->assertFalse($other->members()->whereKey($this->lily->id)->exists());
    }

    public function test_kids_are_drawn_and_their_parent_sees_who_they_got(): void
    {
        $this->group->members()->attach($this->lily);
        Sanctum::actingAs($this->parent);

        $this->postJson(route('groups.draw', $this->group))->assertOk();

        $this->assertSame(3, $this->group->currentAssignments()->count());
        $this->assertTrue($this->group->currentAssignments()->where('giver_id', $this->lily->id)->exists());
        $card = $this->getJson(route('groups.show', $this->group))->assertJsonCount(1, 'managed_assignments');
        $card->assertJsonPath('managed_assignments.0.profile.name', 'Lily')
            ->assertJsonPath('managed_assignments.0.santa.unread_messages', 0);
        $this->assertNotNull($card->json('managed_assignments.0.recipient.name'));

        Sanctum::actingAs($this->nick);
        $this->getJson(route('groups.show', $this->group))->assertJsonCount(0, 'managed_assignments');
    }

    public function test_a_parents_kids_list_puts_unread_chats_first_then_a_to_z(): void
    {
        $zed = app(CreateManagedProfile::class)($this->parent, 'Zed', 'child');
        $amy = app(CreateManagedProfile::class)($this->parent, 'amy', 'pet');
        $this->group->members()->attach([$this->lily->id, $zed->id, $amy->id]);
        $this->group->update(['drawn_at' => now()]);
        $toZed = $this->group->assignments()->create(['draw_number' => 1, 'giver_id' => $this->nick->id, 'receiver_id' => $zed->id]);
        $this->group->assignments()->create(['draw_number' => 1, 'giver_id' => $zed->id, 'receiver_id' => $this->nick->id]);
        $toZed->messages()->create(['from_santa' => true, 'body' => 'Hi Zed!']);
        Sanctum::actingAs($this->parent->fresh() ?? $this->parent);

        $names = $this->getJson(route('groups.show', $this->group))->collect('managed_assignments')->pluck('profile.name')->all();

        $this->assertSame(['Zed', 'amy', 'Lily'], $names);
    }

    public function test_a_parent_chats_as_their_kid_and_nobody_else_can(): void
    {
        $this->group->members()->attach($this->lily);
        $this->group->update(['drawn_at' => now()]);
        $this->group->assignments()->create(['draw_number' => 1, 'giver_id' => $this->lily->id, 'receiver_id' => $this->nick->id]);
        $this->group->assignments()->create(['draw_number' => 1, 'giver_id' => $this->nick->id, 'receiver_id' => $this->parent->id]);
        $this->group->assignments()->create(['draw_number' => 1, 'giver_id' => $this->parent->id, 'receiver_id' => $this->lily->id]);

        Sanctum::actingAs($this->parent);
        $asLily = ['as' => $this->lily->id];
        $this->postJson(route('groups.santa-chat.store', [$this->group, 'my-person', ...$asLily]), ['body' => 'Hi Nick, what do you like?'])
            ->assertNoContent();

        Sanctum::actingAs($this->nick);
        $this->getJson(route('groups.santa-chat.show', [$this->group, 'my-santa']))
            ->assertJsonPath('messages.0.body', 'Hi Nick, what do you like?')
            ->assertJsonPath('with', null);
        $this->postJson(route('groups.santa-chat.store', [$this->group, 'my-santa']), ['body' => 'Trains!'])->assertNoContent();

        // The reply reaches Lily's parent: live, and by email with a link that opens it as Lily.
        Event::assertDispatched(SantaChatChanged::class, fn (SantaChatChanged $event) => $event->userId === $this->parent->id);
        Notification::assertSentTo($this->lily, SantaMessageReceived::class, fn (SantaMessageReceived $notification) => str_ends_with(
            $notification->toMail($this->lily)->actionUrl,
            "chat=my-person&as={$this->lily->id}",
        ));

        Sanctum::actingAs($this->parent);
        $this->getJson(route('groups.santa-chat.show', [$this->group, 'my-person', ...$asLily]))
            ->assertJsonPath('with.name', 'Nick')
            ->assertJsonPath('messages.1.body', 'Trains!');

        Sanctum::actingAs($this->nick);
        $this->getJson(route('groups.santa-chat.show', [$this->group, 'my-person', ...$asLily]))->assertForbidden();

        $stranger = app(CreateManagedProfile::class)($this->parent, 'Not In Group', 'pet');
        // A fresh copy, as a real request would load: the model caches who it manages.
        Sanctum::actingAs($this->parent->fresh() ?? $this->parent);
        $this->getJson(route('groups.santa-chat.show', [$this->group, 'my-person', 'as' => $stranger->id]))->assertNotFound();
    }

    public function test_a_parents_purchase_counts_as_their_kids_gift(): void
    {
        $this->group->members()->attach($this->lily);
        $this->group->update(['drawn_at' => now(), 'exchange_date' => '2026-12-20']);
        $this->group->assignments()->create(['draw_number' => 1, 'giver_id' => $this->lily->id, 'receiver_id' => $this->nick->id]);
        $this->group->assignments()->create(['draw_number' => 1, 'giver_id' => $this->nick->id, 'receiver_id' => $this->lily->id]);
        $item = WishlistItem::factory()->create(['user_id' => $this->nick->id]);
        $item->claims()->create(['user_id' => $this->parent->id, 'quantity' => 1, 'claimed_at' => now(), 'purchased_at' => now()]);

        app(SendExchangeReminders::class)(Carbon::parse('2026-12-06'));

        Notification::assertNotSentTo($this->lily, ShoppingReminder::class);
        Notification::assertSentTo($this->nick, ShoppingReminder::class);
    }

    public function test_the_parent_is_told_nicks_list_is_who_their_kid_drew(): void
    {
        $this->group->members()->attach($this->lily);
        $this->group->update(['drawn_at' => now()]);
        $this->group->assignments()->create(['draw_number' => 1, 'giver_id' => $this->lily->id, 'receiver_id' => $this->nick->id]);
        Sanctum::actingAs($this->parent);

        $this->getJson(route('users.wishlist', $this->nick))
            ->assertJsonPath('my_recipients.0.id', $this->nick->id)
            ->assertJsonPath('my_recipients.0.santa_name', 'Lily');
    }
}
