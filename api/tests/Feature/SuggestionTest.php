<?php

namespace Tests\Feature;

use App\Models\Group;
use App\Models\User;
use App\Models\WishlistItem;
use App\Notifications\SuggestionChanged;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SuggestionTest extends TestCase
{
    use RefreshDatabase;

    /** The person the gift ideas are for. */
    private User $ivy;

    private User $nick;

    private User $holly;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
        $group = Group::factory()->create();
        $this->holly = $group->owner;
        [$this->ivy, $this->nick] = User::factory()->count(2)->create()->all();
        $group->members()->attach([$this->ivy->id, $this->nick->id]);
    }

    public function test_a_group_mate_can_suggest_a_gift_without_a_rating(): void
    {
        Sanctum::actingAs($this->nick);

        $this->postJson(route('wishlist.suggestions.store', $this->ivy), ['name' => 'Reading lamp', 'price' => 45, 'rating' => 5])
            ->assertCreated()
            ->assertJsonPath('name', 'Reading lamp')
            ->assertJsonPath('rating', null)
            ->assertJsonPath('suggestion.mine', true);

        $this->assertDatabaseHas('wishlist_items', [
            'user_id' => $this->ivy->id, 'is_suggestion' => true, 'suggested_by_id' => $this->nick->id,
        ]);
    }

    public function test_the_owner_never_sees_suggestions(): void
    {
        $suggestion = $this->suggest($this->nick, 'Reading lamp');
        WishlistItem::factory()->for($this->ivy, 'owner')->create(['name' => 'Hiking boots']);
        Sanctum::actingAs($this->ivy);

        $this->getJson(route('wishlist.items.index'))->assertOk()->assertJsonCount(1)->assertJsonPath('0.name', 'Hiking boots');

        // Her own list through the member route too.
        $response = $this->getJson(route('users.wishlist', $this->ivy))->assertOk()->assertJsonCount(0, 'suggestions');
        $this->assertStringNotContainsString('Reading lamp', (string) $response->getContent());

        $this->patchJson(route('wishlist.items.update', $suggestion), ['name' => 'Peek'])->assertForbidden();
        $this->deleteJson(route('wishlist.items.destroy', $suggestion))->assertForbidden();
        $this->postJson(route('wishlist.suggestions.store', $this->ivy), ['name' => 'For me'])->assertForbidden();
    }

    public function test_others_see_suggestions_with_the_suggester_named_only_if_they_share_a_group(): void
    {
        $this->suggest($this->nick, 'Reading lamp');
        // Tinsel shares a different group with Ivy, but none with Nick.
        $tinsel = User::factory()->create();
        Group::factory()->for($tinsel, 'owner')->create()->members()->attach($this->ivy);

        Sanctum::actingAs($this->holly);
        $this->getJson(route('users.wishlist', $this->ivy))
            ->assertJsonPath('suggestions.0.name', 'Reading lamp')
            ->assertJsonPath('suggestions.0.suggestion.by', $this->nick->full_name)
            ->assertJsonPath('suggestions.0.suggestion.mine', false);

        Sanctum::actingAs($tinsel);
        $this->getJson(route('users.wishlist', $this->ivy))->assertJsonPath('suggestions.0.suggestion.by', null);
    }

    public function test_only_people_sharing_a_group_with_the_owner_can_suggest(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson(route('wishlist.suggestions.store', $this->ivy), ['name' => 'Spam'])->assertForbidden();
    }

    public function test_anyone_shopping_for_them_can_edit_and_the_suggester_is_emailed(): void
    {
        $suggestion = $this->suggest($this->nick, 'Reading lamp', ['price' => 45]);
        Sanctum::actingAs($this->holly);

        $this->patchJson(route('wishlist.items.update', $suggestion), ['name' => 'Brass reading lamp', 'price' => 60])
            ->assertOk()
            ->assertJsonPath('name', 'Brass reading lamp');

        Notification::assertSentTo($this->nick, SuggestionChanged::class, function (SuggestionChanged $notification) {
            $mail = $notification->toMail($this->nick);

            return ! $notification->removed
                && $notification->editorName === $this->holly->full_name
                && $notification->itemName === 'Reading lamp'
                && array_keys($notification->changes) === ['name', 'price']
                && $mail->subject === "🎁 Your gift idea for {$this->ivy->full_name} was edited";
        });
    }

    public function test_the_suggester_is_emailed_when_someone_else_removes_it_but_not_for_their_own_changes(): void
    {
        $suggestion = $this->suggest($this->nick, 'Reading lamp');

        Sanctum::actingAs($this->nick);
        $this->patchJson(route('wishlist.items.update', $suggestion), ['name' => 'Desk lamp'])->assertOk();
        Notification::assertNothingSent();

        Sanctum::actingAs($this->holly);
        $this->deleteJson(route('wishlist.items.destroy', $suggestion))->assertNoContent();

        $this->assertModelMissing($suggestion);
        Notification::assertSentTo($this->nick, SuggestionChanged::class, fn (SuggestionChanged $notification) => $notification->removed
            && $notification->itemName === 'Desk lamp');
    }

    public function test_suggestions_can_be_claimed_like_any_item(): void
    {
        $suggestion = $this->suggest($this->nick, 'Reading lamp');
        Sanctum::actingAs($this->holly);

        $this->postJson(route('wishlist.items.claim', $suggestion), ['quantity' => 1])->assertSuccessful();

        $this->getJson(route('users.wishlist', $this->ivy))->assertJsonPath('suggestions.0.claim.mine', 1);
    }

    public function test_a_suggestion_outlives_its_suggesters_account_and_stays_hidden_from_the_owner(): void
    {
        $suggestion = $this->suggest($this->nick, 'Reading lamp');

        $this->nick->delete();

        $this->assertTrue($suggestion->fresh()->is_suggestion);
        $this->assertNull($suggestion->fresh()->suggested_by_id);

        Sanctum::actingAs($this->holly);
        $this->getJson(route('users.wishlist', $this->ivy))
            ->assertJsonPath('suggestions.0.name', 'Reading lamp')
            ->assertJsonPath('suggestions.0.suggestion.by', null);

        Sanctum::actingAs($this->ivy);
        $this->getJson(route('wishlist.items.index'))->assertJsonCount(0);
    }

    /**
     * @param  array<string, mixed>  $details
     */
    private function suggest(User $by, string $name, array $details = []): WishlistItem
    {
        return WishlistItem::factory()->for($this->ivy, 'owner')->create([
            'name' => $name, 'is_suggestion' => true, 'suggested_by_id' => $by->id, ...$details,
        ]);
    }
}
