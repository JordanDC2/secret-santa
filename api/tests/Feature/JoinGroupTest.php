<?php

namespace Tests\Feature;

use App\Models\Group;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class JoinGroupTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_join_a_group_before_names_are_drawn(): void
    {
        $group = Group::factory()->create();
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $this->postJson(route('groups.join'), ['join_code' => $group->join_code])->assertSuccessful();

        $this->assertDatabaseHas('group_user', ['group_id' => $group->id, 'user_id' => $user->id]);
    }

    public function test_user_cannot_join_a_group_after_names_are_drawn(): void
    {
        $group = Group::factory()->create(['drawn_at' => now()]);
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $this->postJson(route('groups.join'), ['join_code' => $group->join_code])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('join_code');

        $this->assertDatabaseMissing('group_user', ['group_id' => $group->id, 'user_id' => $user->id]);
    }
}
