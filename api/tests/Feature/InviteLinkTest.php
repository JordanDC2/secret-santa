<?php

namespace Tests\Feature;

use App\Models\Group;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InviteLinkTest extends TestCase
{
    use RefreshDatabase;

    public function test_anyone_with_the_link_sees_which_group_its_for(): void
    {
        $group = Group::factory()->create(['name' => 'Family Swap']);

        $this->getJson(route('invites.show', strtolower($group->join_code)))
            ->assertOk()
            ->assertExactJson([
                'group_name' => 'Family Swap',
                'owner_name' => $group->owner->name,
                'members_count' => 1,
                'is_drawn' => false,
                'already_member' => false,
            ]);
    }

    public function test_a_signed_in_member_is_told_theyre_already_in(): void
    {
        $group = Group::factory()->create();
        Sanctum::actingAs($group->owner);

        $this->getJson(route('invites.show', $group->join_code))->assertJsonPath('already_member', true);

        Sanctum::actingAs(User::factory()->create());
        $this->getJson(route('invites.show', $group->join_code))->assertJsonPath('already_member', false);
    }

    public function test_drawn_groups_say_so_and_unknown_codes_dont_resolve(): void
    {
        $group = Group::factory()->create(['drawn_at' => now()]);

        $this->getJson(route('invites.show', $group->join_code))->assertJsonPath('is_drawn', true);
        $this->getJson(route('invites.show', 'NOPE99'))
            ->assertNotFound()
            ->assertJsonPath('message', 'This invite link is no longer valid. Ask the group owner for a new one.');
    }

    public function test_previews_are_rate_limited_like_joining(): void
    {
        foreach (range(1, 10) as $attempt) {
            $this->getJson(route('invites.show', "GUESS{$attempt}"))->assertNotFound();
        }

        $this->getJson(route('invites.show', 'GUESS11'))->assertTooManyRequests();
    }

    public function test_following_the_link_joins_with_the_usual_rules(): void
    {
        Notification::fake();
        $group = Group::factory()->create();
        $friend = User::factory()->create();
        Sanctum::actingAs($friend);

        $this->postJson(route('groups.join'), ['join_code' => strtolower($group->join_code)])->assertSuccessful();

        $this->assertTrue($group->members()->whereKey($friend->id)->exists());
    }
}
