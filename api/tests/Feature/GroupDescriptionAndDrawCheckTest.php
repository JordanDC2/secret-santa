<?php

namespace Tests\Feature;

use App\Models\Group;
use App\Models\User;
use App\Notifications\SecretSantaAssigned;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GroupDescriptionAndDrawCheckTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_set_and_clear_the_description_without_touching_the_name(): void
    {
        $group = Group::factory()->create(['name' => 'Cousins']);
        Sanctum::actingAs($group->owner);

        $this->patchJson(route('groups.update', $group), ['description' => "Let's keep it under \$50."])
            ->assertOk()
            ->assertJsonPath('description', "Let's keep it under \$50.")
            ->assertJsonPath('name', 'Cousins');

        $this->patchJson(route('groups.update', $group), ['description' => ''])
            ->assertOk()
            ->assertJsonPath('description', null);
    }

    public function test_members_cannot_change_the_description(): void
    {
        $group = Group::factory()->create();
        $group->members()->attach($member = User::factory()->create());
        Sanctum::actingAs($member);

        $this->patchJson(route('groups.update', $group), ['description' => 'Spend $500!'])->assertForbidden();
    }

    public function test_description_is_limited_to_1000_characters(): void
    {
        $group = Group::factory()->create();
        Sanctum::actingAs($group->owner);

        $this->patchJson(route('groups.update', $group), ['description' => str_repeat('a', 1001)])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('description');
    }

    public function test_assignment_email_shows_the_description_as_plain_text(): void
    {
        Notification::fake();
        $group = Group::factory()->create(['description' => "Budget: \$50\n[Free gift](https://evil.example)"]);
        $group->members()->attach(User::factory()->create());
        Sanctum::actingAs($group->owner);

        $this->postJson(route('groups.draw', $group))->assertOk();

        Notification::assertSentTo($group->owner, SecretSantaAssigned::class, function (SecretSantaAssigned $notification) use ($group) {
            $html = (string) $notification->toMail($group->owner)->render();

            return str_contains($html, 'A note from '.e($group->owner->name))
                && str_contains($html, 'Budget: $50')
                && ! str_contains($html, 'href="https://evil.example"');
        });
    }

    public function test_assignment_email_has_no_note_without_a_description(): void
    {
        Notification::fake();
        $group = Group::factory()->create();
        $group->members()->attach(User::factory()->create());
        Sanctum::actingAs($group->owner);

        $this->postJson(route('groups.draw', $group))->assertOk();

        Notification::assertSentTo($group->owner, SecretSantaAssigned::class, function (SecretSantaAssigned $notification) use ($group) {
            return ! str_contains((string) $notification->toMail($group->owner)->render(), 'A note from');
        });
    }

    public function test_a_real_draw_passes_every_check(): void
    {
        Notification::fake();
        $group = Group::factory()->create();
        $group->members()->attach($members = User::factory()->count(3)->create());
        $group->exclusions()->create(['giver_id' => $members[0]->id, 'receiver_id' => $members[1]->id, 'mutual' => true]);
        Sanctum::actingAs($group->owner);
        $this->postJson(route('groups.draw', $group))->assertOk();

        $this->getJson(route('groups.draw.check', $group))
            ->assertOk()
            ->assertJsonPath('verified', true)
            ->assertJsonCount(4, 'checks');
    }

    public function test_the_check_flags_someone_left_without_a_santa(): void
    {
        [$group, $a, $b] = $this->drawnTrio();
        // Simulate a broken draw: b's Santa lost their assignment.
        $group->assignments()->where('receiver_id', $b->id)->delete();
        Sanctum::actingAs($group->owner);

        $response = $this->getJson(route('groups.draw.check', $group))->assertOk()->assertJsonPath('verified', false);

        $this->assertContains("{$b->name} doesn't have exactly one Secret Santa.", $response->json('checks.1.problems'));
    }

    public function test_only_the_owner_can_check_or_list_the_draw(): void
    {
        [$group, $a] = $this->drawnTrio();
        Sanctum::actingAs($a);

        $this->getJson(route('groups.draw.check', $group))->assertForbidden();
        $this->getJson(route('groups.draw.assignments', $group))->assertForbidden();
    }

    public function test_owner_can_list_every_pair_after_the_draw(): void
    {
        [$group] = $this->drawnTrio();
        Sanctum::actingAs($group->owner);

        $this->getJson(route('groups.draw.assignments', $group))
            ->assertOk()
            ->assertJsonCount(3)
            ->assertJsonStructure([['giver' => ['id', 'name'], 'receiver' => ['id', 'name']]]);
    }

    public function test_draw_details_need_a_drawn_group(): void
    {
        $group = Group::factory()->create();
        Sanctum::actingAs($group->owner);

        $this->getJson(route('groups.draw.check', $group))->assertUnprocessable();
        $this->getJson(route('groups.draw.assignments', $group))->assertUnprocessable();
    }

    /**
     * Owner + two members, drawn as a cycle owner → a → b → owner.
     *
     * @return array<int, mixed> [group, a, b]
     */
    private function drawnTrio(): array
    {
        $group = Group::factory()->create();
        [$a, $b] = User::factory()->count(2)->create()->all();
        $group->members()->attach([$a->id, $b->id]);

        foreach ([[$group->owner_id, $a->id], [$a->id, $b->id], [$b->id, $group->owner_id]] as [$giver, $receiver]) {
            $group->assignments()->create(['giver_id' => $giver, 'receiver_id' => $receiver]);
        }
        $group->update(['drawn_at' => now()]);

        return [$group, $a, $b];
    }
}
