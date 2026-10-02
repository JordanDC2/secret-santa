<?php

namespace Tests\Feature;

use App\Events\GroupChanged;
use App\Events\WishlistChanged;
use App\Models\Group;
use App\Models\User;
use App\Models\WishlistItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AccountTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Event::fake([GroupChanged::class, WishlistChanged::class]);
    }

    public function test_name_can_change_without_the_password(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->patchJson(route('account.profile'), ['name' => 'Jordan C', 'email' => $user->email])
            ->assertOk()
            ->assertJsonPath('name', 'Jordan C');
    }

    public function test_changing_email_requires_the_current_password(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->patchJson(route('account.profile'), ['name' => $user->name, 'email' => 'new@example.com'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('current_password');

        $this->patchJson(route('account.profile'), [
            'name' => $user->name,
            'email' => 'new@example.com',
            'current_password' => 'wrong-password',
        ])->assertUnprocessable()->assertJsonValidationErrors('current_password');

        $this->patchJson(route('account.profile'), [
            'name' => $user->name,
            'email' => 'new@example.com',
            'current_password' => 'password',
        ])->assertOk()->assertJsonPath('email', 'new@example.com');
    }

    public function test_email_must_not_belong_to_someone_else(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        Sanctum::actingAs($user);

        $this->patchJson(route('account.profile'), [
            'name' => $user->name,
            'email' => $other->email,
            'current_password' => 'password',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_renaming_yourself_refreshes_your_groups_live(): void
    {
        $group = Group::factory()->create();
        Sanctum::actingAs($group->owner);

        $this->patchJson(route('account.profile'), ['name' => 'New Name', 'email' => $group->owner->email])->assertOk();

        Event::assertDispatched(GroupChanged::class, fn (GroupChanged $event) => $event->groupId === $group->id);
    }

    public function test_password_change_needs_the_current_password_and_a_confirmation(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->putJson(route('account.password'), [
            'current_password' => 'wrong-password',
            'password' => 'brand-new-pass-1',
            'password_confirmation' => 'brand-new-pass-1',
        ])->assertUnprocessable()->assertJsonValidationErrors('current_password');

        $this->putJson(route('account.password'), [
            'current_password' => 'password',
            'password' => 'brand-new-pass-1',
            'password_confirmation' => 'something-else',
        ])->assertUnprocessable()->assertJsonValidationErrors('password');

        $this->putJson(route('account.password'), [
            'current_password' => 'password',
            'password' => 'brand-new-pass-1',
            'password_confirmation' => 'brand-new-pass-1',
        ])->assertNoContent();

        $this->assertTrue(Hash::check('brand-new-pass-1', $user->fresh()->password));
    }

    public function test_deleting_an_account_needs_the_current_password(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->deleteJson(route('account.destroy'), ['current_password' => 'wrong-password'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('current_password');

        $this->assertModelExists($user);
    }

    public function test_deleting_an_account_removes_owned_groups_but_only_leaves_others(): void
    {
        $user = User::factory()->create();
        $owned = Group::factory()->for($user, 'owner')->create();
        $owned->members()->attach($friend = User::factory()->create());

        $joined = Group::factory()->create();
        $joined->members()->attach($user);
        $joined->update(['drawn_at' => now()]);
        $joined->assignments()->create(['giver_id' => $joined->owner_id, 'receiver_id' => $user->id]);

        $claimed = WishlistItem::factory()->for($joined->owner, 'owner')->claimedBy($user)->create();
        WishlistItem::factory()->for($user, 'owner')->create();

        Sanctum::actingAs($user);

        $this->deleteJson(route('account.destroy'), ['current_password' => 'password'])->assertNoContent();

        $this->assertModelMissing($user);
        $this->assertModelMissing($owned);
        $this->assertModelExists($friend);
        $this->assertModelExists($joined);
        $this->assertDatabaseMissing('group_user', ['user_id' => $user->id]);
        $this->assertDatabaseMissing('secret_santa_assignments', ['receiver_id' => $user->id]);
        $this->assertDatabaseMissing('wishlist_items', ['user_id' => $user->id]);
        $this->assertNull($claimed->fresh()->claimed_by_id);

        Event::assertDispatched(GroupChanged::class, fn (GroupChanged $event) => $event->groupId === $owned->id);
        Event::assertDispatched(GroupChanged::class, fn (GroupChanged $event) => $event->groupId === $joined->id);
        Event::assertDispatched(WishlistChanged::class, fn (WishlistChanged $event) => $event->ownerId === $joined->owner_id);
    }
}
