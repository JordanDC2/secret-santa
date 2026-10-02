<?php

namespace Tests\Feature;

use App\Events\GroupChanged;
use App\Events\WishlistChanged;
use App\Models\Group;
use App\Models\User;
use App\Models\WishlistItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LiveUpdatesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Event::fake([GroupChanged::class, WishlistChanged::class]);
        Notification::fake();
    }

    public function test_joining_leaving_renaming_drawing_and_deleting_announce_a_group_change(): void
    {
        $group = Group::factory()->create();
        $friend = User::factory()->create();

        Sanctum::actingAs($friend);
        $this->postJson(route('groups.join'), ['join_code' => $group->join_code])->assertSuccessful();
        $this->postJson(route('groups.leave', $group))->assertNoContent();
        $this->postJson(route('groups.join'), ['join_code' => $group->join_code])->assertSuccessful();

        Sanctum::actingAs($group->owner);
        $this->patchJson(route('groups.update', $group), ['name' => 'Renamed'])->assertOk();
        $this->postJson(route('groups.draw', $group))->assertOk();
        $this->deleteJson(route('groups.destroy', $group))->assertNoContent();

        Event::assertDispatchedTimes(GroupChanged::class, 6);
        Event::assertDispatched(GroupChanged::class, fn (GroupChanged $event) => $event->groupId === $group->id);
    }

    public function test_item_edits_and_claims_announce_a_wishlist_change(): void
    {
        $group = Group::factory()->create();
        $owner = $group->owner;
        $friend = User::factory()->create();
        $group->members()->attach($friend);

        Sanctum::actingAs($owner);
        $id = $this->postJson(route('wishlist.items.store'), ['name' => 'Socks', 'rating' => 3])->json('id');
        $this->patchJson(route('wishlist.items.update', $id), ['name' => 'Wool socks', 'rating' => 4])->assertOk();

        Sanctum::actingAs($friend);
        $this->postJson(route('wishlist.items.claim', $id))->assertOk();
        $this->deleteJson(route('wishlist.items.unclaim', $id))->assertOk();

        Sanctum::actingAs($owner);
        $this->deleteJson(route('wishlist.items.destroy', $id))->assertNoContent();

        Event::assertDispatchedTimes(WishlistChanged::class, 5);
        Event::assertNotDispatched(WishlistChanged::class, fn (WishlistChanged $event) => $event->ownerId !== $owner->id);
    }

    public function test_only_group_mates_other_than_the_owner_get_live_wishlist_updates(): void
    {
        $group = Group::factory()->create();
        $friend = User::factory()->create();
        $group->members()->attach($friend);
        WishlistItem::factory()->for($group->owner, 'owner')->create();

        $this->assertTrue($friend->can('receiveWishlistUpdates', $group->owner));
        $this->assertFalse($group->owner->can('receiveWishlistUpdates', $group->owner));
        $this->assertFalse(User::factory()->create()->can('receiveWishlistUpdates', $group->owner));
    }
}
