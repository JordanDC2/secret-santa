<?php

namespace Tests\Feature;

use App\Models\Group;
use App\Models\User;
use App\Models\WishlistClaim;
use App\Models\WishlistItem;
use App\Notifications\ClaimNudged;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ClaimLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private User $ivy;

    private User $holly;

    private User $nick;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
        $group = Group::factory()->create();
        $this->holly = $group->owner;
        [$this->ivy, $this->nick] = User::factory()->count(2)->create()->all();
        $group->members()->attach([$this->ivy->id, $this->nick->id]);
        Carbon::setTestNow('2026-11-15 12:00:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_claims_never_lapse_and_show_when_they_were_made(): void
    {
        $lamp = $this->lamp();
        $this->claimAs($this->holly, $lamp)->assertSuccessful();

        Carbon::setTestNow(now()->addYears(2));

        $this->viewAs($this->nick)
            ->assertJsonPath('items.0.claim.claimed', 1)
            ->assertJsonPath('items.0.claim.others.0.name', $this->holly->full_name)
            ->assertJsonPath('items.0.claim.others.0.claimed_at', fn ($date) => str_starts_with($date, '2026-11-15'));
        $this->claimAs($this->nick, $lamp)->assertUnprocessable()->assertJsonValidationErrors('item');
    }

    public function test_the_claimer_can_mark_it_bought_and_undo_that(): void
    {
        $lamp = $this->lamp();
        $this->claimAs($this->holly, $lamp)->assertSuccessful();

        $this->postJson(route('wishlist.items.claim.purchased', $lamp))
            ->assertOk()
            ->assertJsonPath('claim.mine_purchased_at', fn ($date) => $date !== null);
        $this->viewAs($this->nick)->assertJsonPath('items.0.claim.others.0.purchased', true);

        Sanctum::actingAs($this->holly);
        $this->deleteJson(route('wishlist.items.claim.unpurchased', $lamp))
            ->assertOk()
            ->assertJsonPath('claim.mine', 1)
            ->assertJsonPath('claim.mine_purchased_at', null);
    }

    public function test_only_the_claimer_can_mark_it_bought(): void
    {
        $lamp = $this->lamp();
        $this->claimAs($this->holly, $lamp)->assertSuccessful();

        Sanctum::actingAs($this->nick);
        $this->postJson(route('wishlist.items.claim.purchased', $lamp))->assertForbidden();

        Sanctum::actingAs($this->ivy);
        $this->postJson(route('wishlist.items.claim.purchased', $lamp))->assertForbidden();
    }

    public function test_claiming_more_clears_the_bought_mark(): void
    {
        $socks = $this->lamp(['quantity' => 3]);
        $this->claimAs($this->holly, $socks, 1)->assertSuccessful();
        $this->postJson(route('wishlist.items.claim.purchased', $socks))->assertOk();

        $this->claimAs($this->holly, $socks, 1)
            ->assertSuccessful()
            ->assertJsonPath('claim.mine', 2)
            ->assertJsonPath('claim.mine_purchased_at', null);
    }

    public function test_a_fellow_shopper_can_nudge_the_claimer(): void
    {
        $lamp = $this->lamp();
        $this->claimAs($this->holly, $lamp)->assertSuccessful();
        $claim = $this->claimOf($this->holly, $lamp);
        Carbon::setTestNow(now()->addMonths(10));

        Sanctum::actingAs($this->nick);
        $this->postJson(route('wishlist.claims.nudge', $claim))->assertNoContent();

        Notification::assertSentTo($this->holly, ClaimNudged::class, function (ClaimNudged $notification) {
            $mail = $notification->toMail($this->holly);

            return $notification->nudgerName === $this->nick->full_name
                && $notification->claimedAt === 'November 2026'
                && $mail->subject === "🔔 Still getting Reading lamp for {$this->ivy->full_name}?";
        });
        $this->viewAs($this->nick)->assertJsonPath('items.0.claim.others.0.nudged_at', fn ($date) => $date !== null);
    }

    public function test_a_claim_can_be_nudged_at_most_every_three_days(): void
    {
        $lamp = $this->lamp();
        $this->claimAs($this->holly, $lamp)->assertSuccessful();
        $claim = $this->claimOf($this->holly, $lamp);

        Sanctum::actingAs($this->nick);
        $this->postJson(route('wishlist.claims.nudge', $claim))->assertNoContent();

        Carbon::setTestNow(now()->addDays(2));
        $this->postJson(route('wishlist.claims.nudge', $claim))->assertUnprocessable()->assertJsonValidationErrors('claim');

        Carbon::setTestNow(now()->addDays(2));
        $this->postJson(route('wishlist.claims.nudge', $claim))->assertNoContent();

        Notification::assertSentToTimes($this->holly, ClaimNudged::class, 2);
    }

    public function test_bought_claims_your_own_claims_and_the_owner_cannot_nudge(): void
    {
        $lamp = $this->lamp();
        $this->claimAs($this->holly, $lamp)->assertSuccessful();
        $claim = $this->claimOf($this->holly, $lamp);

        $this->postJson(route('wishlist.claims.nudge', $claim))->assertForbidden(); // Holly, her own claim

        Sanctum::actingAs($this->ivy);
        $this->postJson(route('wishlist.claims.nudge', $claim))->assertForbidden(); // the list's owner

        Sanctum::actingAs(User::factory()->create());
        $this->postJson(route('wishlist.claims.nudge', $claim))->assertForbidden(); // a stranger

        Sanctum::actingAs($this->holly);
        $this->postJson(route('wishlist.items.claim.purchased', $lamp))->assertOk();
        Sanctum::actingAs($this->nick);
        $this->postJson(route('wishlist.claims.nudge', $claim))->assertForbidden(); // already bought

        Notification::assertNothingSent();
    }

    public function test_nudges_only_name_people_the_claimer_shares_a_group_with(): void
    {
        $lamp = $this->lamp();
        $this->claimAs($this->holly, $lamp)->assertSuccessful();
        // Tinsel shares a group with Ivy, but not with Holly.
        $tinsel = User::factory()->create();
        Group::factory()->for($tinsel, 'owner')->create()->members()->attach($this->ivy);

        Sanctum::actingAs($tinsel);
        $this->postJson(route('wishlist.claims.nudge', $this->claimOf($this->holly, $lamp)))->assertNoContent();

        Notification::assertSentTo($this->holly, ClaimNudged::class, fn (ClaimNudged $notification) => $notification->nudgerName === null);
    }

    public function test_got_it_hides_an_item_from_everyone_and_can_be_undone(): void
    {
        $lamp = $this->lamp();
        $this->claimAs($this->holly, $lamp)->assertSuccessful();

        Sanctum::actingAs($this->ivy);
        $this->postJson(route('wishlist.items.received', $lamp))->assertOk()->assertJsonPath('received_at', fn ($date) => $date !== null);
        $this->getJson(route('wishlist.items.index'))->assertJsonPath('0.received_at', fn ($date) => $date !== null);

        $this->viewAs($this->nick)->assertJsonCount(0, 'items');
        $this->claimAs($this->nick, $lamp)->assertUnprocessable();

        Sanctum::actingAs($this->ivy);
        $this->deleteJson(route('wishlist.items.unreceived', $lamp))->assertOk()->assertJsonPath('received_at', null);
        $this->viewAs($this->nick)->assertJsonCount(1, 'items');
    }

    public function test_only_the_owner_can_mark_their_own_items_received(): void
    {
        $lamp = $this->lamp();
        $idea = WishlistItem::factory()->for($this->ivy, 'owner')->create(['is_suggestion' => true, 'suggested_by_id' => $this->nick->id]);

        Sanctum::actingAs($this->nick);
        $this->postJson(route('wishlist.items.received', $lamp))->assertForbidden();

        Sanctum::actingAs($this->ivy);
        $this->postJson(route('wishlist.items.received', $idea))->assertForbidden();
    }

    public function test_the_owner_never_sees_claims_or_purchases(): void
    {
        $lamp = $this->lamp();
        $this->claimAs($this->holly, $lamp)->assertSuccessful();
        $this->postJson(route('wishlist.items.claim.purchased', $lamp))->assertOk();

        Sanctum::actingAs($this->ivy);
        $this->getJson(route('wishlist.items.index'))->assertJsonMissingPath('0.claim');
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function lamp(array $attributes = []): WishlistItem
    {
        return WishlistItem::factory()->for($this->ivy, 'owner')->create(['name' => 'Reading lamp', 'quantity' => 1, ...$attributes]);
    }

    private function claimOf(User $user, WishlistItem $item): WishlistClaim
    {
        return $item->claims()->where('user_id', $user->id)->firstOrFail();
    }

    /**
     * @return TestResponse<JsonResponse>
     */
    private function claimAs(User $user, WishlistItem $item, int $quantity = 1): TestResponse
    {
        Sanctum::actingAs($user);

        return $this->postJson(route('wishlist.items.claim', $item), ['quantity' => $quantity]);
    }

    /**
     * @return TestResponse<JsonResponse>
     */
    private function viewAs(User $user): TestResponse
    {
        Sanctum::actingAs($user);

        return $this->getJson(route('users.wishlist', $this->ivy));
    }
}
