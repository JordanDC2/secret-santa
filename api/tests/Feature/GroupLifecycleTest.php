<?php

namespace Tests\Feature;

use App\Models\Group;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GroupLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_delete_a_drawn_group_and_its_memberships_and_assignments_go_with_it(): void
    {
        $group = $this->groupWithMember();
        $group->assignments()->create(['giver_id' => $group->owner_id, 'receiver_id' => $this->memberOf($group)->id]);
        $group->update(['drawn_at' => now()]);

        Sanctum::actingAs($group->owner);

        $this->deleteJson(route('groups.destroy', $group))->assertNoContent();

        $this->assertModelMissing($group);
        $this->assertDatabaseMissing('group_user', ['group_id' => $group->id]);
        $this->assertDatabaseMissing('secret_santa_assignments', ['group_id' => $group->id]);
    }

    public function test_owner_can_rename_the_group_even_after_the_draw(): void
    {
        $group = $this->groupWithMember();
        $group->update(['drawn_at' => now()]);

        Sanctum::actingAs($group->owner);

        $this->patchJson(route('groups.update', $group), ['name' => '  Cousins 2026  '])
            ->assertOk()
            ->assertJsonPath('name', 'Cousins 2026');

        $this->assertSame('Cousins 2026', $group->fresh()->name);
    }

    public function test_member_cannot_rename_the_group(): void
    {
        $group = $this->groupWithMember();

        Sanctum::actingAs($this->memberOf($group));

        $this->patchJson(route('groups.update', $group), ['name' => 'Hijacked'])->assertForbidden();

        $this->assertNotSame('Hijacked', $group->fresh()->name);
    }

    public function test_group_name_is_required(): void
    {
        $group = $this->groupWithMember();

        Sanctum::actingAs($group->owner);

        $this->patchJson(route('groups.update', $group), ['name' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_member_cannot_delete_the_group(): void
    {
        $group = $this->groupWithMember();

        Sanctum::actingAs($this->memberOf($group));

        $this->deleteJson(route('groups.destroy', $group))->assertForbidden();

        $this->assertModelExists($group);
    }

    public function test_member_can_leave_before_names_are_drawn(): void
    {
        $group = $this->groupWithMember();
        $member = $this->memberOf($group);

        Sanctum::actingAs($member);

        $this->postJson(route('groups.leave', $group))->assertNoContent();

        $this->assertDatabaseMissing('group_user', ['group_id' => $group->id, 'user_id' => $member->id]);
        $this->getJson(route('groups.index'))->assertJsonCount(0);
    }

    public function test_owner_cannot_leave_their_own_group(): void
    {
        $group = $this->groupWithMember();

        Sanctum::actingAs($group->owner);

        $this->postJson(route('groups.leave', $group))->assertForbidden();
    }

    public function test_non_member_cannot_leave_or_delete_a_group(): void
    {
        $group = $this->groupWithMember();

        Sanctum::actingAs(User::factory()->create());

        $this->postJson(route('groups.leave', $group))->assertForbidden();
        $this->deleteJson(route('groups.destroy', $group))->assertForbidden();
    }

    private function groupWithMember(): Group
    {
        $group = Group::factory()->create();
        $group->members()->attach(User::factory()->create());

        return $group;
    }

    private function memberOf(Group $group): User
    {
        return $group->members()->where('user_id', '!=', $group->owner_id)->firstOrFail();
    }
}
