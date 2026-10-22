<?php

namespace Tests\Feature;

use App\Models\SilentNightProgress;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SilentNightTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A player, signed in: an admin, since only admins can play while the game's being finished.
     *
     * @param  array<string, mixed>  $attributes
     */
    private function player(array $attributes = []): User
    {
        $user = User::factory()->create($attributes);
        config(['app.admin_emails' => [...(array) config('app.admin_emails'), $user->email]]);
        Sanctum::actingAs($user);

        return $user;
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function night(array $overrides = []): array
    {
        return [...['seconds' => 400, 'kills' => 900, 'level' => 20, 'bargains' => 0, 'won' => false, 'bosses' => 1], ...$overrides];
    }

    public function test_a_finished_night_is_kept(): void
    {
        $user = $this->player();

        $this->postJson(route('silent-night.runs'), $this->night(['won' => true, 'seconds' => 1200, 'bargains' => 2]))->assertOk();

        $run = $user->silentNightRuns()->sole();
        $this->assertSame(1200, $run->seconds);
        $this->assertSame(2, $run->bargains);
        $this->assertTrue($run->won);
    }

    public function test_a_night_banks_coal_for_its_time_kills_bosses_and_a_win(): void
    {
        $user = $this->player();

        // 400 seconds (20), 900 broken (22), one boss (20).
        $this->postJson(route('silent-night.runs'), $this->night())
            ->assertJsonPath('coal_earned', 62)
            ->assertJsonPath('progress.coal', 62);

        // Dawn: 60 + 200 + 4 bosses (80) + the win (60).
        $this->postJson(route('silent-night.runs'), $this->night(['seconds' => 1200, 'kills' => 8000, 'bosses' => 4, 'won' => true]))
            ->assertJsonPath('coal_earned', 400)
            ->assertJsonPath('progress.coal', 462);
        $this->assertSame(462, SilentNightProgress::for($user)->coal);
    }

    public function test_coal_picked_up_in_the_night_is_banked_too_but_never_more_than_a_coal_a_second(): void
    {
        $user = $this->player();

        // 400 seconds, 900 slain and a boss (62), and 35 picked up off the snow.
        $this->postJson(route('silent-night.runs'), $this->night(['coal_found' => 35]))->assertJsonPath('coal_earned', 97);

        $this->postJson(route('silent-night.runs'), $this->night(['coal_found' => 401]))->assertJsonValidationErrors('coal_found');
        $this->postJson(route('silent-night.runs'), $this->night(['coal_found' => -1]))->assertJsonValidationErrors('coal_found');
        $this->assertSame(97, SilentNightProgress::for($user)->coal);
    }

    public function test_the_coal_cellar_sells_upgrades_a_level_at_a_time_and_unlocks_the_cast(): void
    {
        $user = $this->player();
        SilentNightProgress::for($user)->update(['coal' => 200]);

        $this->getJson(route('silent-night.progress'))
            ->assertOk()
            ->assertJsonPath('cast', ['elf'])
            ->assertJsonPath('character', 'elf')
            ->assertJsonPath('cellar.wool', 0);

        $this->postJson(route('silent-night.purchases'), ['kind' => 'cellar', 'item' => 'wool'])
            ->assertOk()
            ->assertJsonPath('coal', 170)
            ->assertJsonPath('cellar.wool', 1);

        // Santa: unlocked and picked to play as.
        $this->postJson(route('silent-night.purchases'), ['kind' => 'cast', 'item' => 'santa'])
            ->assertJsonPath('coal', 20)
            ->assertJsonPath('cast', ['elf', 'santa'])
            ->assertJsonPath('character', 'santa');

        $this->postJson(route('silent-night.purchases'), ['kind' => 'cast', 'item' => 'santa'])->assertJsonValidationErrors('item');
        $this->postJson(route('silent-night.purchases'), ['kind' => 'cellar', 'item' => 'canes'])->assertJsonValidationErrors('item');
        $this->postJson(route('silent-night.purchases'), ['kind' => 'cellar', 'item' => 'sleigh'])->assertJsonValidationErrors('item');

        $this->patchJson(route('silent-night.character'), ['character' => 'elf'])->assertJsonPath('character', 'elf');
        $this->patchJson(route('silent-night.character'), ['character' => 'reindeer'])->assertJsonValidationErrors('character');
    }

    public function test_the_coal_cellar_unlocks_the_second_wave_of_patrons(): void
    {
        $user = $this->player();
        SilentNightProgress::for($user)->update(['coal' => 250]);

        $this->getJson(route('silent-night.progress'))->assertJsonPath('patrons', []);

        $this->postJson(route('silent-night.purchases'), ['kind' => 'patron', 'item' => 'befana'])
            ->assertOk()
            ->assertJsonPath('coal', 50)
            ->assertJsonPath('patrons', ['befana']);

        $this->postJson(route('silent-night.purchases'), ['kind' => 'patron', 'item' => 'befana'])->assertJsonValidationErrors('item');
        $this->postJson(route('silent-night.purchases'), ['kind' => 'patron', 'item' => 'mariLwyd'])->assertJsonValidationErrors('item');
        $this->postJson(route('silent-night.purchases'), ['kind' => 'patron', 'item' => 'laFlor'])->assertJsonValidationErrors('item');
    }

    public function test_coal_unlocks_the_other_guns(): void
    {
        $user = $this->player();
        SilentNightProgress::for($user)->update(['coal' => 150]);

        $this->getJson(route('silent-night.progress'))->assertJsonPath('guns', ['gun']);

        $this->postJson(route('silent-night.purchases'), ['kind' => 'gun', 'item' => 'crossbow'])
            ->assertOk()
            ->assertJsonPath('coal', 70)
            ->assertJsonPath('guns', ['gun', 'crossbow']);

        // Already theirs (the candy cane gun always is), not a gun, or more than they've coal for.
        $this->postJson(route('silent-night.purchases'), ['kind' => 'gun', 'item' => 'crossbow'])->assertJsonValidationErrors('item');
        $this->postJson(route('silent-night.purchases'), ['kind' => 'gun', 'item' => 'gun'])->assertJsonValidationErrors('item');
        $this->postJson(route('silent-night.purchases'), ['kind' => 'gun', 'item' => 'cannon'])->assertJsonValidationErrors('item');
        $this->postJson(route('silent-night.purchases'), ['kind' => 'gun', 'item' => 'snowCannon'])->assertJsonValidationErrors('item');
        $this->assertSame(70, SilentNightProgress::for($user)->coal);
    }

    public function test_a_cellar_upgrade_stops_at_its_last_level(): void
    {
        $user = $this->player();
        SilentNightProgress::for($user)->update(['coal' => 10000, 'cellar' => ['boots' => 3]]);

        $this->postJson(route('silent-night.purchases'), ['kind' => 'cellar', 'item' => 'boots'])->assertJsonValidationErrors('item');
    }

    public function test_nights_past_dawn_or_with_more_bargains_than_krampus_has_are_refused(): void
    {
        $this->player();

        $this->postJson(route('silent-night.runs'), $this->night(['seconds' => 1201]))->assertJsonValidationErrors('seconds');
        $this->postJson(route('silent-night.runs'), $this->night(['bargains' => 6]))->assertJsonValidationErrors('bargains');
        $this->postJson(route('silent-night.runs'), $this->night(['level' => 0]))->assertJsonValidationErrors('level');
        $this->postJson(route('silent-night.runs'), $this->night(['kills' => -1]))->assertJsonValidationErrors('kills');
        $this->postJson(route('silent-night.runs'), $this->night(['bosses' => 5]))->assertJsonValidationErrors('bosses');
    }

    public function test_the_boards_rank_each_players_best_this_week_and_all_time(): void
    {
        $nick = $this->player(['first_name' => 'Nick', 'last_name' => 'Frost']);
        $this->postJson(route('silent-night.runs'), $this->night(['seconds' => 1100, 'kills' => 5000]))->assertOk();
        $this->travel(8)->days();

        $holly = $this->player(['first_name' => 'Holly', 'last_name' => 'Berry']);
        $this->postJson(route('silent-night.runs'), $this->night(['seconds' => 300, 'kills' => 700]))->assertOk();
        $this->postJson(route('silent-night.runs'), $this->night(['seconds' => 650, 'kills' => 400]))->assertOk();

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
        $this->postJson(route('silent-night.runs'), $this->night(['seconds' => 1200, 'kills' => 6000, 'won' => true]))->assertOk();

        $this->player(['first_name' => 'Holly', 'last_name' => 'Berry']);
        $this->postJson(route('silent-night.runs'), $this->night(['seconds' => 1200, 'kills' => 8000]))->assertOk();

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
        $this->postJson(route('silent-night.runs'), $this->night(['seconds' => 1200, 'won' => true]))->assertOk();

        $this->player(['first_name' => 'Holly', 'last_name' => 'Berry']);
        $this->postJson(route('silent-night.runs'), $this->night(['seconds' => 1200, 'bargains' => 5]))->assertOk();
        $this->postJson(route('silent-night.runs'), $this->night(['seconds' => 1200, 'bargains' => 3, 'won' => true]))->assertOk();

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

    public function test_only_admins_can_play_while_its_being_finished(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson(route('silent-night.progress'))->assertForbidden();
        $this->postJson(route('silent-night.runs'), $this->night())->assertForbidden();
        $this->getJson(route('silent-night.leaderboard', ['board' => 'night', 'period' => 'all']))->assertForbidden();
    }

    public function test_only_signed_in_players_record_nights_or_see_the_boards(): void
    {
        $this->postJson(route('silent-night.runs'), $this->night())->assertUnauthorized();
        $this->getJson(route('silent-night.leaderboard', ['board' => 'night', 'period' => 'all']))->assertUnauthorized();
        $this->getJson(route('silent-night.progress'))->assertUnauthorized();
    }
}
