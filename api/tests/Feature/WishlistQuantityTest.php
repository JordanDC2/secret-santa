<?php

namespace Tests\Feature;

use App\Models\Group;
use App\Models\User;
use App\Models\WishlistItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WishlistQuantityTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private User $ivy;

    private User $nick;

    protected function setUp(): void
    {
        parent::setUp();

        $group = Group::factory()->create();
        $this->owner = $group->owner;
        [$this->ivy, $this->nick] = User::factory()->count(2)->create()->all();
        $group->members()->attach([$this->ivy->id, $this->nick->id]);
    }

    public function test_items_have_a_quantity_that_defaults_to_one(): void
    {
        Sanctum::actingAs($this->owner);

        $this->postJson(route('wishlist.items.store'), ['name' => 'Socks', 'rating' => 3])
            ->assertCreated()->assertJsonPath('quantity', 1);

        $this->postJson(route('wishlist.items.store'), ['name' => '4-pack of socks', 'rating' => 3, 'quantity' => 2])
            ->assertCreated()->assertJsonPath('quantity', 2);

        $this->postJson(route('wishlist.items.store'), ['name' => 'Too many', 'rating' => 3, 'quantity' => 0])
            ->assertUnprocessable()->assertJsonValidationErrors('quantity');
    }

    public function test_two_people_can_each_claim_part_of_an_item(): void
    {
        $socks = WishlistItem::factory()->for($this->owner, 'owner')->create(['quantity' => 2]);

        Sanctum::actingAs($this->ivy);
        $this->postJson(route('wishlist.items.claim', $socks))->assertOk()
            ->assertJsonPath('claim.claimed', 1)
            ->assertJsonPath('claim.mine', 1);

        Sanctum::actingAs($this->nick);
        $this->postJson(route('wishlist.items.claim', $socks))->assertOk()
            ->assertJsonPath('claim.claimed', 2)
            ->assertJsonPath('claim.mine', 1)
            ->assertJsonPath('claim.others.0.name', $this->ivy->name);

        // Now it's fully claimed, so it locks.
        $late = User::factory()->create();
        $this->owner->groups()->first()->members()->attach($late);
        Sanctum::actingAs($late);
        $this->postJson(route('wishlist.items.claim', $socks))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['item' => 'already claimed']);
    }

    public function test_someone_can_claim_all_of_them_at_once_but_not_more_than_are_left(): void
    {
        $socks = WishlistItem::factory()->for($this->owner, 'owner')->create(['quantity' => 3]);

        Sanctum::actingAs($this->ivy);
        $this->postJson(route('wishlist.items.claim', $socks), ['quantity' => 2])->assertOk()->assertJsonPath('claim.mine', 2);

        Sanctum::actingAs($this->nick);
        $this->postJson(route('wishlist.items.claim', $socks), ['quantity' => 2])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['quantity' => 'Only 1 left']);
    }

    public function test_claiming_again_adds_to_your_claim_and_undo_removes_only_yours(): void
    {
        $socks = WishlistItem::factory()->for($this->owner, 'owner')->claimedBy($this->nick)->create(['quantity' => 3]);

        Sanctum::actingAs($this->ivy);
        $this->postJson(route('wishlist.items.claim', $socks))->assertOk();
        $this->postJson(route('wishlist.items.claim', $socks))->assertOk()->assertJsonPath('claim.mine', 2);

        $this->deleteJson(route('wishlist.items.unclaim', $socks))->assertOk()
            ->assertJsonPath('claim.mine', 0)
            ->assertJsonPath('claim.claimed', 1);

        $this->assertSame([$this->nick->id], $socks->claims()->pluck('user_id')->all());
    }

    public function test_the_owner_sees_their_quantity_but_nothing_about_claims(): void
    {
        WishlistItem::factory()->for($this->owner, 'owner')->claimedBy($this->ivy, 2)->create(['quantity' => 2]);

        Sanctum::actingAs($this->owner);

        $response = $this->getJson(route('wishlist.items.index'))->assertOk()->assertJsonPath('0.quantity', 2);
        $this->assertArrayNotHasKey('claim', $response->json('0'));
        $this->assertStringNotContainsString($this->ivy->name, $response->getContent());
    }
}
