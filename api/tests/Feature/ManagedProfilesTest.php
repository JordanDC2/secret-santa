<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WishlistItem;
use App\Notifications\ResetPasswordLink;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ManagedProfilesTest extends TestCase
{
    use RefreshDatabase;

    private User $parent;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
        $this->parent = User::factory()->create(['first_name' => 'Holly', 'email' => 'holly@example.test']);
    }

    public function test_a_parent_adds_renames_and_lists_their_kids_and_pets(): void
    {
        Sanctum::actingAs($this->parent);

        $lily = $this->postJson(route('account.profiles.store'), ['first_name' => 'Lily', 'kind' => 'child'])
            ->assertCreated()
            ->assertJsonPath('kind', 'child')
            ->assertJsonPath('managers.0.name', $this->parent->full_name)
            ->json('id');
        $this->postJson(route('account.profiles.store'), ['first_name' => 'Biscuit', 'kind' => 'pet'])->assertCreated();
        $this->patchJson(route('account.profiles.update', $lily), ['first_name' => 'Lily Rose', 'kind' => 'child'])
            ->assertOk()
            ->assertJsonPath('name', 'Lily Rose');

        $this->getJson(route('account.profiles.index'))
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath('0.name', 'Biscuit')
            ->assertJsonPath('1.name', 'Lily Rose');

        $this->postJson(route('account.profiles.store'), ['first_name' => '', 'kind' => 'dragon'])
            ->assertJsonValidationErrors(['first_name', 'kind']);
    }

    public function test_a_profile_can_never_sign_in_or_get_a_password_reset(): void
    {
        $lily = $this->createProfile('Lily');

        $this->assertStringEndsWith('@profiles.invalid', $lily->email);
        $this->app['auth']->shouldUse('web');
        $this->postJson(route('auth.login'), ['email' => $lily->email, 'password' => ''])->assertJsonValidationErrors('password');
        $this->postJson(route('auth.login'), ['email' => $lily->email, 'password' => 'guess-me-please'])->assertStatus(422);

        $this->postJson(route('auth.password.email'), ['email' => $lily->email]);
        Notification::assertNotSentTo($lily, ResetPasswordLink::class);
    }

    public function test_a_profiles_emails_go_to_its_managers(): void
    {
        $lily = $this->createProfile('Lily');

        $this->assertSame(['holly@example.test'], $lily->routeNotificationForMail());
        $this->assertSame('holly@example.test', $this->parent->routeNotificationForMail());
    }

    public function test_the_parent_keeps_the_profiles_wishlist_and_sees_whats_claimed(): void
    {
        $lily = $this->createProfile('Lily');
        Sanctum::actingAs($this->parent);

        $kite = $this->postJson(route('wishlist.items.store'), ['name' => 'Kite', 'rating' => 5, 'owner_id' => $lily->id])
            ->assertCreated()
            ->json('id');
        $this->assertIsInt($kite);
        $this->assertSame($lily->id, WishlistItem::findOrFail($kite)->user_id);
        $this->assertSame(0, $this->parent->wishlistItems()->count());

        $this->patchJson(route('wishlist.items.update', $kite), ['name' => 'Red kite', 'rating' => 4])->assertOk();
        $this->postJson(route('wishlist.items.claim', $kite), ['quantity' => 1])->assertOk();
        $this->postJson(route('wishlist.items.received', $kite))->assertOk();

        // Unlike their own list, a kid's list shows the parent what's been claimed.
        $this->getJson(route('wishlist.items.index', ['owner' => $lily->id]))
            ->assertOk()
            ->assertJsonPath('0.name', 'Red kite')
            ->assertJsonPath('0.claim.mine', 1)
            ->assertJsonPath('0.received_at', fn ($at) => $at !== null);

        $this->deleteJson(route('wishlist.items.destroy', $kite))->assertNoContent();
    }

    public function test_nobody_else_can_touch_a_profile_or_its_list(): void
    {
        $lily = $this->createProfile('Lily');
        $item = WishlistItem::factory()->create(['user_id' => $lily->id]);
        $stranger = User::factory()->create();
        Sanctum::actingAs($stranger);

        $this->getJson(route('wishlist.items.index', ['owner' => $lily->id]))->assertForbidden();
        $this->postJson(route('wishlist.items.store'), ['name' => 'x', 'rating' => 1, 'owner_id' => $lily->id])->assertForbidden();
        $this->patchJson(route('wishlist.items.update', $item), ['name' => 'x', 'rating' => 1])->assertForbidden();
        $this->patchJson(route('account.profiles.update', $lily), ['first_name' => 'x', 'kind' => 'pet'])->assertForbidden();
        $this->deleteJson(route('account.profiles.destroy', $lily))->assertForbidden();
        $this->getJson(route('account.profiles.index'))->assertOk()->assertJsonCount(0);

        // A real account isn't a profile, even to someone who... manages nothing at all.
        $this->patchJson(route('account.profiles.update', $this->parent), ['first_name' => 'x', 'kind' => 'pet'])->assertForbidden();
    }

    public function test_removing_a_profile_removes_its_wishlist(): void
    {
        $lily = $this->createProfile('Lily');
        WishlistItem::factory()->count(2)->create(['user_id' => $lily->id]);
        Sanctum::actingAs($this->parent);

        $this->deleteJson(route('account.profiles.destroy', $lily))->assertNoContent();

        $this->assertNull(User::find($lily->id));
        $this->assertSame(0, WishlistItem::where('user_id', $lily->id)->count());
        $this->assertTrue($this->parent->fresh()?->exists);
    }

    private function createProfile(string $name): User
    {
        Sanctum::actingAs($this->parent);
        $id = $this->postJson(route('account.profiles.store'), ['first_name' => $name, 'kind' => 'child'])->json('id');
        $this->assertIsInt($id);
        $this->app['auth']->forgetGuards();

        return User::findOrFail($id);
    }
}
