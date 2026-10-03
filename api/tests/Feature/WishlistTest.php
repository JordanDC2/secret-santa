<?php

namespace Tests\Feature;

use App\Models\Group;
use App\Models\User;
use App\Models\WishlistItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WishlistTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_add_edit_and_remove_items(): void
    {
        $owner = User::factory()->create();
        Sanctum::actingAs($owner);

        $id = $this->postJson(route('wishlist.items.store'), [
            'name' => 'Wool socks',
            'url' => 'https://example.com/socks',
            'price' => 18.5,
            'notes' => 'Size L, anything but beige',
            'rating' => 4,
        ])->assertCreated()->assertJsonPath('price', '18.50')->json('id');

        $this->patchJson(route('wishlist.items.update', $id), ['name' => 'Warm wool socks', 'rating' => 5])
            ->assertOk()
            ->assertJsonPath('name', 'Warm wool socks')
            ->assertJsonPath('rating', 5);

        $this->deleteJson(route('wishlist.items.destroy', $id))->assertNoContent();
        $this->assertDatabaseMissing('wishlist_items', ['id' => $id]);
    }

    public function test_items_are_sorted_by_stars_then_by_when_they_were_added(): void
    {
        $owner = User::factory()->create();
        $first = WishlistItem::factory()->for($owner, 'owner')->create(['rating' => 3]);
        $favorite = WishlistItem::factory()->for($owner, 'owner')->create(['rating' => 5]);
        $second = WishlistItem::factory()->for($owner, 'owner')->create(['rating' => 3]);

        Sanctum::actingAs($owner);

        $ids = $this->getJson(route('wishlist.items.index'))->assertOk()->json('*.id');

        $this->assertSame([$favorite->id, $first->id, $second->id], $ids);
    }

    public function test_owner_never_receives_claim_info_for_their_own_items(): void
    {
        [$owner, $friend] = $this->groupMates();
        WishlistItem::factory()->for($owner, 'owner')->claimedBy($friend)->create();

        Sanctum::actingAs($owner);

        $own = $this->getJson(route('wishlist.items.index'))->assertOk();
        $viaProfile = $this->getJson(route('users.wishlist', $owner))->assertOk();

        $this->assertArrayNotHasKey('claim', $own->json('0'));
        $this->assertArrayNotHasKey('claim', $viaProfile->json('items.0'));
        $this->assertStringNotContainsString($friend->name, $own->getContent().$viaProfile->getContent());
    }

    public function test_group_mate_sees_the_list_with_who_claimed_what(): void
    {
        [$owner, $friend, $cousin] = $this->groupMates(3);
        WishlistItem::factory()->for($owner, 'owner')->claimedBy($cousin)->create(['rating' => 5]);
        WishlistItem::factory()->for($owner, 'owner')->create(['rating' => 1]);

        Sanctum::actingAs($friend);

        $this->getJson(route('users.wishlist', $owner))
            ->assertOk()
            ->assertJsonPath('user.name', $owner->name)
            ->assertJsonPath('items.0.claim.others.0.name', $cousin->name)
            ->assertJsonPath('items.0.claim.mine', 0)
            ->assertJsonPath('items.1.claim', null);
    }

    public function test_wishlist_tells_the_viewer_who_their_secret_santa_people_are(): void
    {
        [$owner, $friend, $cousin] = $this->groupMates(3);
        $group = $owner->ownedGroups()->first();
        $group->assignments()->create(['giver_id' => $friend->id, 'receiver_id' => $cousin->id]);
        $group->update(['drawn_at' => now()]);

        Sanctum::actingAs($friend);

        $this->getJson(route('users.wishlist', $owner))
            ->assertOk()
            ->assertJsonPath('my_recipients', [[
                'id' => $cousin->id,
                'name' => $cousin->name,
                'group' => ['id' => $group->id, 'name' => $group->name],
            ]]);
    }

    public function test_viewer_without_an_assignment_gets_no_recipients(): void
    {
        [$owner, $friend] = $this->groupMates();

        Sanctum::actingAs($friend);

        $this->getJson(route('users.wishlist', $owner))->assertOk()->assertJsonPath('my_recipients', []);
    }

    public function test_claimers_outside_your_groups_stay_anonymous(): void
    {
        [$owner, $friend] = $this->groupMates();
        $stranger = User::factory()->create();
        $otherGroup = Group::factory()->for($stranger, 'owner')->create();
        $otherGroup->members()->attach($owner);
        $item = WishlistItem::factory()->for($owner, 'owner')->claimedBy($stranger)->create();

        Sanctum::actingAs($friend);
        $this->getJson(route('users.wishlist', $owner))
            ->assertOk()
            ->assertJsonPath('items.0.claim.others.0.name', null)
            ->assertJsonPath('items.0.claim.mine', 0);

        // Someone who does share a group with the claimer still sees their name.
        $otherGroup->members()->attach($friend);
        $this->getJson(route('users.wishlist', $owner))
            ->assertJsonPath('items.0.claim.others.0.name', $stranger->name);

        $this->assertModelExists($item);
    }

    public function test_someone_outside_the_owners_groups_cannot_view_their_list(): void
    {
        [$owner] = $this->groupMates();

        Sanctum::actingAs(User::factory()->create());

        $this->getJson(route('users.wishlist', $owner))->assertForbidden();
    }

    public function test_group_mate_can_claim_and_unclaim_an_item(): void
    {
        [$owner, $friend] = $this->groupMates();
        $item = WishlistItem::factory()->for($owner, 'owner')->create();

        Sanctum::actingAs($friend);

        $this->postJson(route('wishlist.items.claim', $item))
            ->assertOk()
            ->assertJsonPath('claim.mine', 1);

        $this->deleteJson(route('wishlist.items.unclaim', $item))
            ->assertOk()
            ->assertJsonPath('claim', null);

        $this->assertSame(0, $item->claims()->count());
    }

    public function test_an_item_cannot_be_claimed_twice(): void
    {
        [$owner, $friend, $cousin] = $this->groupMates(3);
        $item = WishlistItem::factory()->for($owner, 'owner')->claimedBy($cousin)->create();

        Sanctum::actingAs($friend);

        $this->postJson(route('wishlist.items.claim', $item))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('item');

        $this->assertSame([$cousin->id], $item->claims()->pluck('user_id')->all());
    }

    public function test_only_the_claimer_can_unclaim(): void
    {
        [$owner, $friend, $cousin] = $this->groupMates(3);
        $item = WishlistItem::factory()->for($owner, 'owner')->claimedBy($cousin)->create();

        Sanctum::actingAs($friend);

        $this->deleteJson(route('wishlist.items.unclaim', $item))->assertForbidden();
    }

    public function test_owner_and_outsiders_cannot_claim(): void
    {
        [$owner] = $this->groupMates();
        $item = WishlistItem::factory()->for($owner, 'owner')->create();

        Sanctum::actingAs($owner);
        $this->postJson(route('wishlist.items.claim', $item))->assertForbidden();

        Sanctum::actingAs(User::factory()->create());
        $this->postJson(route('wishlist.items.claim', $item))->assertForbidden();
    }

    public function test_others_cannot_edit_or_remove_someone_elses_items(): void
    {
        [$owner, $friend] = $this->groupMates();
        $item = WishlistItem::factory()->for($owner, 'owner')->create();

        Sanctum::actingAs($friend);

        $this->patchJson(route('wishlist.items.update', $item), ['name' => 'Coal', 'rating' => 5])->assertForbidden();
        $this->deleteJson(route('wishlist.items.destroy', $item))->assertForbidden();
    }

    public function test_links_must_be_web_addresses(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson(route('wishlist.items.store'), [
            'name' => 'Sneaky',
            'url' => 'javascript:alert(1)',
            'rating' => 3,
        ])->assertUnprocessable()->assertJsonValidationErrors('url');
    }

    /**
     * @return array<int, User>
     */
    private function groupMates(int $count = 2): array
    {
        $group = Group::factory()->create();
        $others = User::factory()->count($count - 1)->create();
        $group->members()->attach($others);

        return [$group->owner, ...$others];
    }
}
