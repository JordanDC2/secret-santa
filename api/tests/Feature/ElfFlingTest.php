<?php

namespace Tests\Feature;

use App\Models\ElfFlingProgress;
use App\Models\User;
use App\Support\ElfFling\Leaderboard;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ElfFlingTest extends TestCase
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

    public function test_a_new_player_starts_with_nothing_but_the_free_looks(): void
    {
        $this->player();

        $this->getJson(route('elf-fling.progress'))
            ->assertOk()
            ->assertJsonPath('coins', 0)
            ->assertJsonPath('upgrades.swingStrength', 0)
            ->assertJsonPath('skins', ['elf'])
            ->assertJsonPath('skin', 'elf')
            ->assertJsonPath('batters', ['reindeer'])
            ->assertJsonPath('batter', 'reindeer')
            ->assertJsonPath('best_distance', null)
            ->assertJsonPath('imported', false);
    }

    public function test_a_throw_banks_its_coins_with_the_lucky_stocking_added_by_the_server(): void
    {
        $user = $this->player();
        ElfFlingProgress::for($user)->update(['upgrades' => ['luckyStocking' => 2]]);

        $this->postJson(route('elf-fling.throws'), ['distance' => 123.45, 'coins_collected' => 10])
            ->assertOk()
            ->assertJsonPath('banked', 15)
            ->assertJsonPath('new_best', true)
            ->assertJsonPath('progress.coins', 15)
            ->assertJsonPath('progress.best_distance', 123.5);

        $this->postJson(route('elf-fling.throws'), ['distance' => 50, 'coins_collected' => 4])
            ->assertJsonPath('new_best', false)
            ->assertJsonPath('progress.coins', 21)
            ->assertJsonPath('progress.best_distance', 123.5);
    }

    public function test_huge_runs_and_hauls_are_welcome_but_nonsense_is_refused(): void
    {
        $this->player();

        $this->postJson(route('elf-fling.throws'), ['distance' => 25000, 'coins_collected' => 50000])
            ->assertOk()
            ->assertJsonPath('progress.coins', 50000)
            ->assertJsonPath('progress.best_distance', 25000);
        $this->postJson(route('elf-fling.throws'), ['distance' => -5, 'coins_collected' => 'lots'])
            ->assertJsonValidationErrors(['distance', 'coins_collected']);
    }

    public function test_upgrades_are_bought_level_by_level_at_the_servers_prices(): void
    {
        $user = $this->player();
        ElfFlingProgress::for($user)->update(['coins' => 100]);

        $this->postJson(route('elf-fling.purchases'), ['kind' => 'upgrade', 'item' => 'swingStrength'])
            ->assertOk()
            ->assertJsonPath('coins', 75)
            ->assertJsonPath('upgrades.swingStrength', 1);

        $this->postJson(route('elf-fling.purchases'), ['kind' => 'upgrade', 'item' => 'swingStrength'])
            ->assertJsonPath('coins', 25)
            ->assertJsonPath('upgrades.swingStrength', 2);

        // Level 3 costs 80.
        $this->postJson(route('elf-fling.purchases'), ['kind' => 'upgrade', 'item' => 'swingStrength'])
            ->assertJsonValidationErrors(['item' => 'Not enough coins']);
    }

    public function test_maxed_unknown_and_owned_items_cant_be_bought(): void
    {
        $user = $this->player();
        ElfFlingProgress::for($user)->update(['coins' => 5000, 'upgrades' => ['rocket' => 1]]);

        $this->postJson(route('elf-fling.purchases'), ['kind' => 'upgrade', 'item' => 'rocket'])
            ->assertJsonValidationErrors(['item' => 'fully upgraded']);
        $this->postJson(route('elf-fling.purchases'), ['kind' => 'upgrade', 'item' => 'jetpack'])
            ->assertJsonValidationErrors(['item' => 'isn\'t in the shop']);
        $this->postJson(route('elf-fling.purchases'), ['kind' => 'skin', 'item' => 'elf'])
            ->assertJsonValidationErrors(['item' => 'already have']);

        $this->assertSame(5000, ElfFlingProgress::for($user)->coins);
    }

    public function test_a_bought_look_is_put_to_use_and_only_owned_looks_can_be_used(): void
    {
        $user = $this->player();
        ElfFlingProgress::for($user)->update(['coins' => 400]);

        $this->postJson(route('elf-fling.purchases'), ['kind' => 'skin', 'item' => 'reindeer'])
            ->assertJsonPath('coins', 100)
            ->assertJsonPath('skins', ['elf', 'reindeer'])
            ->assertJsonPath('skin', 'reindeer');

        $this->patchJson(route('elf-fling.looks'), ['skin' => 'elf'])->assertJsonPath('skin', 'elf');
        $this->patchJson(route('elf-fling.looks'), ['batter' => 'santa'])->assertJsonValidationErrors('batter');
    }

    public function test_a_devices_progress_is_brought_over_once_and_the_better_of_each_wins(): void
    {
        $user = $this->player();
        ElfFlingProgress::for($user)->update(['coins' => 50, 'upgrades' => ['swingStrength' => 3]]);
        $device = [
            'coins' => 400,
            'upgrades' => ['swingStrength' => 1, 'crackers' => 1, 'madeUp' => 9],
            'skins' => ['elf', 'santa'],
            'batters' => ['reindeer'],
            'best_distance' => 321.04,
        ];

        $this->postJson(route('elf-fling.import'), $device)
            ->assertOk()
            ->assertJsonPath('coins', 400)
            ->assertJsonPath('upgrades.swingStrength', 3)
            ->assertJsonPath('upgrades.crackers', 1)
            ->assertJsonPath('skins', ['elf', 'santa'])
            ->assertJsonPath('best_distance', 321)
            ->assertJsonPath('imported', true);

        // A second go changes nothing.
        $this->postJson(route('elf-fling.import'), [...$device, 'coins' => 9000])->assertJsonPath('coins', 400);
        $this->assertDatabaseCount('elf_fling_throws', 1);
    }

    public function test_imports_are_kept_to_what_the_shop_sells(): void
    {
        $this->player();

        $this->postJson(route('elf-fling.import'), [
            'coins' => 999999,
            'upgrades' => ['swingStrength' => 50],
            'skins' => ['dragon'],
            'batters' => [],
            'best_distance' => null,
        ])->assertJsonValidationErrors(['upgrades.swingStrength', 'skins.0'])->assertJsonMissingValidationErrors('coins');
    }

    public function test_the_leaderboards_rank_everyone_by_best_distance_or_coins_with_short_tidy_names(): void
    {
        $holly = User::factory()->create(['first_name' => 'holly', 'last_name' => 'berry']);
        $nick = User::factory()->create(['first_name' => 'NICK', 'last_name' => 'claus']);
        $deshawn = User::factory()->create(['first_name' => 'DeShawn', 'last_name' => 'young']);
        $holly->elfFlingThrows()->createMany([['distance' => 300, 'coins' => 10], ['distance' => 120, 'coins' => 40]]);
        $nick->elfFlingThrows()->create(['distance' => 450, 'coins' => 20]);
        $deshawn->elfFlingThrows()->create(['distance' => 90, 'coins' => 5]);
        Sanctum::actingAs($deshawn);

        $this->getJson(route('elf-fling.leaderboard', ['board' => 'distance', 'period' => 'all']))
            ->assertOk()
            ->assertJsonPath('entries.0.name', 'Nick C.')
            ->assertJsonPath('entries.0.value', 450)
            ->assertJsonPath('entries.1.name', 'Holly B.')
            ->assertJsonPath('entries.1.value', 300)
            ->assertJsonPath('entries.2.name', 'DeShawn Y.')
            ->assertJsonPath('entries.2.is_you', true)
            ->assertJsonPath('you.rank', 3);

        $this->getJson(route('elf-fling.leaderboard', ['board' => 'coins', 'period' => 'all']))
            ->assertJsonPath('entries.0.name', 'Holly B.')
            ->assertJsonPath('entries.0.value', 50)
            ->assertJsonPath('entries.1.value', 20);

        // Swings count every throw taken here (Holly 2), not a device's imported best.
        $nick->elfFlingThrows()->create(['distance' => 999, 'coins' => 0, 'from_device' => true]);
        $this->getJson(route('elf-fling.leaderboard', ['board' => 'swings', 'period' => 'all']))
            ->assertJsonPath('entries.0.name', 'Holly B.')
            ->assertJsonPath('entries.0.value', 2)
            ->assertJsonPath('entries.1.value', 1);
    }

    public function test_this_weeks_board_starts_on_monday_and_leaves_out_device_imports(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-12-10 18:00', 'America/Chicago'));
        config(['app.reminder_timezone' => 'America/Chicago']);
        $holly = User::factory()->create();
        $nick = User::factory()->create();
        $holly->elfFlingThrows()->create(['distance' => 500, 'coins' => 30, 'created_at' => now()->subDays(5)]);
        $holly->elfFlingThrows()->create(['distance' => 100, 'coins' => 3]);
        $nick->elfFlingThrows()->create(['distance' => 900, 'coins' => 0, 'from_device' => true]);
        Sanctum::actingAs($nick);

        $week = $this->getJson(route('elf-fling.leaderboard', ['board' => 'distance', 'period' => 'week']));
        $week->assertJsonCount(1, 'entries')->assertJsonPath('entries.0.value', 100)->assertJsonPath('you', null);

        $this->getJson(route('elf-fling.leaderboard', ['board' => 'distance', 'period' => 'all']))
            ->assertJsonPath('entries.0.value', 900)
            ->assertJsonPath('entries.1.value', 500);
    }

    public function test_kids_and_pets_never_appear_and_you_see_your_rank_beyond_the_top(): void
    {
        config(['elf_fling.leaderboard_size' => 2]);
        $kid = User::factory()->create(['managed_kind' => 'child']);
        $kid->elfFlingThrows()->create(['distance' => 999, 'coins' => 1]);
        foreach ([400, 300, 200] as $distance) {
            User::factory()->create()->elfFlingThrows()->create(['distance' => $distance, 'coins' => 1]);
        }
        $me = $this->player();
        $me->elfFlingThrows()->create(['distance' => 100, 'coins' => 1]);

        $this->getJson(route('elf-fling.leaderboard', ['board' => 'distance', 'period' => 'all']))
            ->assertJsonCount(2, 'entries')
            ->assertJsonPath('entries.0.value', 400)
            ->assertJsonPath('you.rank', 4)
            ->assertJsonPath('you.value', 100);
    }

    public function test_display_names_tidy_case_but_keep_deliberate_capitals(): void
    {
        $this->assertSame('Holly B.', Leaderboard::displayName('holly', 'berry'));
        $this->assertSame('Mary-Kate O.', Leaderboard::displayName('MARY-KATE', "o'neil"));
        $this->assertSame('McKenzie L.', Leaderboard::displayName('McKenzie', 'Lee'));
        $this->assertSame('Ivy', Leaderboard::displayName(' ivy ', null));
    }

    public function test_deleting_an_account_removes_its_progress_and_throws(): void
    {
        $user = $this->player();
        ElfFlingProgress::for($user);
        $user->elfFlingThrows()->create(['distance' => 10, 'coins' => 1]);

        $user->delete();

        $this->assertDatabaseCount('elf_fling_progress', 0);
        $this->assertDatabaseCount('elf_fling_throws', 0);
    }
}
