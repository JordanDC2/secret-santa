<?php

namespace Tests\Feature;

use App\Models\Group;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ExclusionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_add_list_and_remove_exclusions(): void
    {
        [$group, $a, $b] = $this->groupOf(4);
        Sanctum::actingAs($group->owner);

        $id = $this->postJson(route('groups.exclusions.store', $group), [
            'giver_id' => $a->id,
            'receiver_id' => $b->id,
            'mutual' => true,
        ])->assertCreated()
            ->assertJsonPath('giver.name', $a->name)
            ->assertJsonPath('mutual', true)
            ->json('id');

        $this->getJson(route('groups.exclusions.index', $group))->assertOk()->assertJsonCount(1);
        $this->getJson(route('groups.index'))->assertJsonPath('0.exclusions_count', 1);

        $this->deleteJson(route('groups.exclusions.destroy', [$group, $id]))->assertNoContent();
        $this->assertDatabaseCount('group_exclusions', 0);
    }

    public function test_members_cannot_see_or_change_exclusions(): void
    {
        [$group, $a, $b] = $this->groupOf(4);
        Sanctum::actingAs($a);

        $this->getJson(route('groups.exclusions.index', $group))->assertForbidden();
        $this->postJson(route('groups.exclusions.store', $group), [
            'giver_id' => $a->id,
            'receiver_id' => $b->id,
            'mutual' => true,
        ])->assertForbidden();
        $this->getJson(route('groups.index'))->assertJsonMissingPath('0.exclusions_count');
    }

    public function test_exclusions_must_be_between_two_different_members(): void
    {
        [$group, $a] = $this->groupOf(4);
        Sanctum::actingAs($group->owner);

        $this->postJson(route('groups.exclusions.store', $group), ['giver_id' => $a->id, 'receiver_id' => $a->id, 'mutual' => true])
            ->assertUnprocessable()->assertJsonValidationErrors('receiver_id');

        $this->postJson(route('groups.exclusions.store', $group), [
            'giver_id' => $a->id,
            'receiver_id' => User::factory()->create()->id,
            'mutual' => true,
        ])->assertUnprocessable()->assertJsonValidationErrors('giver_id');
    }

    public function test_the_same_pair_cannot_be_excluded_twice_in_either_direction(): void
    {
        [$group, $a, $b] = $this->groupOf(4);
        Sanctum::actingAs($group->owner);
        $group->exclusions()->create(['giver_id' => $a->id, 'receiver_id' => $b->id, 'mutual' => false]);

        $this->postJson(route('groups.exclusions.store', $group), ['giver_id' => $b->id, 'receiver_id' => $a->id, 'mutual' => false])
            ->assertUnprocessable()->assertJsonValidationErrors('giver_id');
    }

    public function test_an_exclusion_that_would_make_the_draw_impossible_is_rejected(): void
    {
        [$group, $a] = $this->groupOf(2);
        Sanctum::actingAs($group->owner);

        $this->postJson(route('groups.exclusions.store', $group), ['giver_id' => $group->owner_id, 'receiver_id' => $a->id, 'mutual' => true])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['giver_id' => 'no way to match everyone']);
    }

    public function test_the_draw_respects_one_way_and_two_way_exclusions(): void
    {
        Notification::fake();
        [$group, $a, $b, $c] = $this->groupOf(4);
        $group->exclusions()->create(['giver_id' => $a->id, 'receiver_id' => $b->id, 'mutual' => true]);
        $group->exclusions()->create(['giver_id' => $c->id, 'receiver_id' => $group->owner_id, 'mutual' => false]);
        Sanctum::actingAs($group->owner);

        for ($i = 0; $i < 20; $i++) {
            // Reset straight in the database; the in-memory model is stale after each draw.
            Group::whereKey($group->id)->update(['drawn_at' => null]);
            $this->postJson(route('groups.draw', $group))->assertOk();

            $drawn = $group->assignments()->pluck('receiver_id', 'giver_id');
            $this->assertNotSame($b->id, $drawn[$a->id]);
            $this->assertNotSame($a->id, $drawn[$b->id]);
            $this->assertNotSame($group->owner_id, $drawn[$c->id]);
        }
    }

    public function test_exclusions_lock_once_names_are_drawn(): void
    {
        [$group, $a, $b] = $this->groupOf(4);
        $exclusion = $group->exclusions()->create(['giver_id' => $a->id, 'receiver_id' => $b->id, 'mutual' => true]);
        $group->update(['drawn_at' => now()]);
        Sanctum::actingAs($group->owner);

        $this->deleteJson(route('groups.exclusions.destroy', [$group, $exclusion]))->assertUnprocessable();
        $this->postJson(route('groups.exclusions.store', $group), ['giver_id' => $b->id, 'receiver_id' => $group->owner_id, 'mutual' => true])
            ->assertUnprocessable()->assertJsonValidationErrors('group');
    }

    public function test_leaving_a_group_drops_that_members_exclusions(): void
    {
        [$group, $a, $b] = $this->groupOf(4);
        $group->exclusions()->create(['giver_id' => $a->id, 'receiver_id' => $b->id, 'mutual' => true]);
        Sanctum::actingAs($a);

        $this->postJson(route('groups.leave', $group))->assertNoContent();

        $this->assertDatabaseCount('group_exclusions', 0);
    }

    public function test_an_exclusion_from_another_group_cannot_be_removed_through_this_one(): void
    {
        [$group] = $this->groupOf(4);
        [$otherGroup, $x, $y] = $this->groupOf(4);
        $foreign = $otherGroup->exclusions()->create(['giver_id' => $x->id, 'receiver_id' => $y->id, 'mutual' => true]);
        Sanctum::actingAs($group->owner);

        $this->deleteJson(route('groups.exclusions.destroy', [$group, $foreign]))->assertNotFound();
        $this->assertModelExists($foreign);
    }

    /**
     * A group with an owner and $size - 1 other members.
     *
     * @return array<int, mixed> [group, ...other members]
     */
    private function groupOf(int $size): array
    {
        $group = Group::factory()->create();
        $others = User::factory()->count($size - 1)->create();
        $group->members()->attach($others);

        return [$group, ...$others];
    }
}
