<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SilentNightTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function player(array $attributes = []): User
    {
        $user = User::factory()->create($attributes);
        Sanctum::actingAs($user);

        return $user;
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function night(array $overrides = []): array
    {
        return [...['seconds' => 400, 'kills' => 900, 'level' => 20, 'bargains' => 0, 'won' => false], ...$overrides];
    }

    public function test_a_finished_night_is_kept(): void
    {
        $user = $this->player();

        $this->postJson(route('silent-night.runs'), $this->night(['won' => true, 'seconds' => 1200, 'bargains' => 2]))->assertNoContent();

        $run = $user->silentNightRuns()->sole();
        $this->assertSame(1200, $run->seconds);
        $this->assertSame(2, $run->bargains);
        $this->assertTrue($run->won);
    }

    public function test_nights_past_dawn_or_with_more_bargains_than_krampus_has_are_refused(): void
    {
        $this->player();

        $this->postJson(route('silent-night.runs'), $this->night(['seconds' => 1201]))->assertJsonValidationErrors('seconds');
        $this->postJson(route('silent-night.runs'), $this->night(['bargains' => 6]))->assertJsonValidationErrors('bargains');
        $this->postJson(route('silent-night.runs'), $this->night(['level' => 0]))->assertJsonValidationErrors('level');
        $this->postJson(route('silent-night.runs'), $this->night(['kills' => -1]))->assertJsonValidationErrors('kills');
    }

    public function test_the_boards_rank_each_players_best_this_week_and_all_time(): void
    {
        $nick = $this->player(['first_name' => 'Nick', 'last_name' => 'Frost']);
        $this->postJson(route('silent-night.runs'), $this->night(['seconds' => 1100, 'kills' => 5000]))->assertNoContent();
        $this->travel(8)->days();

        $holly = $this->player(['first_name' => 'Holly', 'last_name' => 'Berry']);
        $this->postJson(route('silent-night.runs'), $this->night(['seconds' => 300, 'kills' => 700]))->assertNoContent();
        $this->postJson(route('silent-night.runs'), $this->night(['seconds' => 650, 'kills' => 400]))->assertNoContent();

        // Nick's night was last week: only Holly's best this week, both all time.
        $this->getJson(route('silent-night.leaderboard', ['board' => 'night', 'period' => 'week']))
            ->assertOk()
            ->assertJsonCount(1, 'entries')
            ->assertJsonPath('entries.0.name', 'Holly B.')
            ->assertJsonPath('entries.0.value', 650)
            ->assertJsonPath('entries.0.is_you', true);
        $this->getJson(route('silent-night.leaderboard', ['board' => 'night', 'period' => 'all']))
            ->assertJsonPath('entries.0.name', 'Nick F.')
            ->assertJsonPath('entries.1.value', 650)
            ->assertJsonPath('you.rank', 2);

        // Most broken in a night: each player's best night, not their total.
        $this->getJson(route('silent-night.leaderboard', ['board' => 'kills', 'period' => 'all']))
            ->assertJsonPath('entries.0.value', 5000)
            ->assertJsonPath('entries.1.value', 700);
    }

    public function test_nights_that_both_reach_dawn_rank_by_the_most_broken(): void
    {
        $this->player(['first_name' => 'Nick', 'last_name' => 'Frost']);
        $this->postJson(route('silent-night.runs'), $this->night(['seconds' => 1200, 'kills' => 6000, 'won' => true]))->assertNoContent();

        $this->player(['first_name' => 'Holly', 'last_name' => 'Berry']);
        $this->postJson(route('silent-night.runs'), $this->night(['seconds' => 1200, 'kills' => 8000]))->assertNoContent();

        $this->getJson(route('silent-night.leaderboard', ['board' => 'night', 'period' => 'all']))
            ->assertJsonPath('entries.0.name', 'Holly B.')
            ->assertJsonPath('entries.0.value', 1200)
            ->assertJsonPath('entries.1.name', 'Nick F.')
            ->assertJsonPath('entries.1.rank', 2)
            ->assertJsonPath('you.rank', 1);
    }

    public function test_krampus_board_counts_only_nights_won_even_without_bargains(): void
    {
        $this->player(['first_name' => 'Nick', 'last_name' => 'Frost']);
        $this->postJson(route('silent-night.runs'), $this->night(['seconds' => 1200, 'won' => true]))->assertNoContent();

        $this->player(['first_name' => 'Holly', 'last_name' => 'Berry']);
        $this->postJson(route('silent-night.runs'), $this->night(['seconds' => 1200, 'bargains' => 5]))->assertNoContent();
        $this->postJson(route('silent-night.runs'), $this->night(['seconds' => 1200, 'bargains' => 3, 'won' => true]))->assertNoContent();

        $this->getJson(route('silent-night.leaderboard', ['board' => 'krampus', 'period' => 'all']))
            ->assertJsonCount(2, 'entries')
            ->assertJsonPath('entries.0.name', 'Holly B.')
            ->assertJsonPath('entries.0.value', 3)
            ->assertJsonPath('entries.1.name', 'Nick F.')
            ->assertJsonPath('entries.1.value', 0);
    }

    public function test_kids_and_pets_never_show_on_the_boards(): void
    {
        $kid = User::factory()->create(['managed_kind' => 'child']);
        $kid->silentNightRuns()->create($this->night());
        $this->player();

        $this->getJson(route('silent-night.leaderboard', ['board' => 'night', 'period' => 'all']))->assertJsonCount(0, 'entries');
    }

    public function test_only_signed_in_players_record_nights_or_see_the_boards(): void
    {
        $this->postJson(route('silent-night.runs'), $this->night())->assertUnauthorized();
        $this->getJson(route('silent-night.leaderboard', ['board' => 'night', 'period' => 'all']))->assertUnauthorized();
    }
}
