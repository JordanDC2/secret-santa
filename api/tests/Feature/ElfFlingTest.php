<?php

namespace Tests\Feature;

use App\Events\ElfFlingLeaderboardChanged;
use App\Models\ElfFlingProgress;
use App\Models\User;
use App\Support\ElfFling\Leaderboard;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Event;
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
            ->assertJsonPath('gems', 0)
            ->assertJsonPath('prestiges', 0)
            ->assertJsonPath('upgrades.swingStrength', 0)
            ->assertJsonPath('gem_upgrades.swingStrength', 0)
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

    public function test_wrapping_up_christmas_turns_spare_coins_into_gems_and_starts_the_coin_shop_over(): void
    {
        $user = $this->player();
        ElfFlingProgress::for($user)->update([
            'coins' => 5000,
            'upgrades' => ['swingStrength' => 5, 'rocket' => 1],
            'skins' => ['santa'],
            'skin' => 'santa',
        ]);
        $user->elfFlingThrows()->create(['distance' => 400, 'coins' => 90]);

        $this->postJson(route('elf-fling.prestige'))
            ->assertOk()
            ->assertJsonPath('gems', 22)
            ->assertJsonPath('progress.gems', 22)
            ->assertJsonPath('progress.prestiges', 1)
            ->assertJsonPath('progress.coins', 0)
            ->assertJsonPath('progress.upgrades.swingStrength', 0)
            ->assertJsonPath('progress.upgrades.rocket', 0)
            ->assertJsonPath('progress.skin', 'santa')
            ->assertJsonPath('progress.best_distance', 400);

        // Gems stack up over later Christmases.
        ElfFlingProgress::for($user)->update(['coins' => 1000]);

        $this->postJson(route('elf-fling.prestige'))->assertJsonPath('progress.gems', 32);

        ElfFlingProgress::for($user)->update(['coins' => 9]);

        $this->postJson(route('elf-fling.prestige'))->assertJsonValidationErrors(['coins']);
        $this->assertSame(2, ElfFlingProgress::for($user)->prestiges);
    }

    public function test_gem_levels_survive_prestige_as_extra_levels_or_kept_coin_levels(): void
    {
        $user = $this->player();
        ElfFlingProgress::for($user)->update(['coins' => 5000, 'gems' => 30, 'upgrades' => ['swingStrength' => 5]]);

        $this->postJson(route('elf-fling.purchases'), ['kind' => 'gemUpgrade', 'item' => 'springyBoots'])
            ->assertOk()
            ->assertJsonPath('gem_upgrades.springyBoots', 1)
            ->assertJsonPath('gems', 22)
            ->assertJsonPath('coins', 5000);
        $this->postJson(route('elf-fling.purchases'), ['kind' => 'gemUpgrade', 'item' => 'swingStrength'])
            ->assertJsonPath('gem_upgrades.swingStrength', 1)
            ->assertJsonPath('gems', 20);
        $this->postJson(route('elf-fling.purchases'), ['kind' => 'gemUpgrade', 'item' => 'rocket'])
            ->assertJsonPath('gem_upgrades.rocket', 1)
            ->assertJsonPath('gems', 16);

        $this->postJson(route('elf-fling.prestige'))
            ->assertJsonPath('progress.upgrades.swingStrength', 0)
            ->assertJsonPath('progress.gem_upgrades.springyBoots', 1)
            ->assertJsonPath('progress.gem_upgrades.rocket', 1);

        // Springy boots' gem level goes on top of the coin shop's three; swing strength's is
        // a kept coin level, so it never goes past five.
        $progress = ElfFlingProgress::for($user);
        $this->assertSame(1, $progress->combinedLevel('springyBoots'));
        $this->assertSame(4, $progress->maxLevel('springyBoots'));
        $this->assertSame(1, $progress->combinedLevel('swingStrength'));
        $this->assertSame(5, $progress->maxLevel('swingStrength'));

        // The rocket is owned with gems, so there's nothing to buy with coins.
        $progress->update(['coins' => 1000]);
        $this->postJson(route('elf-fling.purchases'), ['kind' => 'upgrade', 'item' => 'rocket'])
            ->assertJsonValidationErrors(['item' => 'That\'s already fully upgraded.']);
        $this->postJson(route('elf-fling.purchases'), ['kind' => 'gemUpgrade', 'item' => 'rocket'])
            ->assertJsonValidationErrors(['item' => 'That\'s already fully upgraded.']);

        // Kept sled runners count as bought (and never go past the coin shop's three): the next
        // with coins is priced as level 3.
        $progress->update(['gems' => 6, 'coins' => 500]);
        $this->postJson(route('elf-fling.purchases'), ['kind' => 'gemUpgrade', 'item' => 'sledRunners']);
        $this->postJson(route('elf-fling.purchases'), ['kind' => 'gemUpgrade', 'item' => 'sledRunners'])
            ->assertJsonPath('gem_upgrades.sledRunners', 2);
        $this->postJson(route('elf-fling.purchases'), ['kind' => 'upgrade', 'item' => 'sledRunners'])
            ->assertJsonPath('upgrades.sledRunners', 1)
            ->assertJsonPath('coins', 500 - 130);
        $this->assertSame(3, $progress->fresh()->combinedLevel('sledRunners'));
        $this->postJson(route('elf-fling.purchases'), ['kind' => 'upgrade', 'item' => 'sledRunners'])
            ->assertJsonValidationErrors(['item' => 'That\'s already fully upgraded.']);
    }

    public function test_gem_upgrades_cost_gems_and_kept_stocking_levels_add_to_every_throws_coins(): void
    {
        $user = $this->player();
        ElfFlingProgress::for($user)->update(['coins' => 500, 'gems' => 11, 'upgrades' => ['luckyStocking' => 2]]);

        $this->postJson(route('elf-fling.purchases'), ['kind' => 'gemUpgrade', 'item' => 'luckyStocking'])
            ->assertOk()
            ->assertJsonPath('gem_upgrades.luckyStocking', 1)
            ->assertJsonPath('gems', 1)
            ->assertJsonPath('coins', 500);

        $this->postJson(route('elf-fling.purchases'), ['kind' => 'gemUpgrade', 'item' => 'luckyStocking'])
            ->assertJsonValidationErrors(['item' => 'That\'s already fully upgraded.']);
        $this->postJson(route('elf-fling.purchases'), ['kind' => 'gemUpgrade', 'item' => 'christmasBonus'])
            ->assertJsonValidationErrors(['item' => 'Not enough gems for that yet.']);
        $this->postJson(route('elf-fling.purchases'), ['kind' => 'gemUpgrade', 'item' => 'santa'])
            ->assertJsonValidationErrors(['item' => 'That isn\'t in the shop.']);

        // Three stocking levels between the shops: +75%.
        $this->postJson(route('elf-fling.throws'), ['distance' => 100, 'coins_collected' => 20])
            ->assertJsonPath('banked', 35)
            ->assertJsonPath('progress.coins', 535);
    }

    public function test_the_christmas_bonus_multiplies_every_throws_coins_and_is_only_sold_for_gems(): void
    {
        $user = $this->player();
        ElfFlingProgress::for($user)->update(['coins' => 5000, 'gems' => 35, 'upgrades' => ['luckyStocking' => 2]]);

        $this->postJson(route('elf-fling.purchases'), ['kind' => 'upgrade', 'item' => 'christmasBonus'])
            ->assertJsonValidationErrors(['item' => 'That isn\'t in the shop.']);
        $this->postJson(route('elf-fling.purchases'), ['kind' => 'gemUpgrade', 'item' => 'christmasBonus'])
            ->assertJsonPath('gem_upgrades.christmasBonus', 1);

        // 10 coins, +50% from the stocking, doubled.
        $this->postJson(route('elf-fling.throws'), ['distance' => 100, 'coins_collected' => 10])
            ->assertJsonPath('banked', 30);

        $this->postJson(route('elf-fling.purchases'), ['kind' => 'gemUpgrade', 'item' => 'christmasBonus'])
            ->assertJsonPath('gem_upgrades.christmasBonus', 2)
            ->assertJsonPath('gems', 0);
        // Doubled again.
        $this->postJson(route('elf-fling.throws'), ['distance' => 100, 'coins_collected' => 10])
            ->assertJsonPath('banked', 60);
    }

    public function test_off_season_training_and_the_polar_jet_stream_are_single_gem_only_purchases(): void
    {
        $user = $this->player();
        ElfFlingProgress::for($user)->update(['coins' => 5000, 'gems' => 60]);

        $this->postJson(route('elf-fling.purchases'), ['kind' => 'upgrade', 'item' => 'offSeasonTraining'])
            ->assertJsonValidationErrors(['item' => 'That isn\'t in the shop.']);
        $this->postJson(route('elf-fling.purchases'), ['kind' => 'gemUpgrade', 'item' => 'offSeasonTraining'])
            ->assertJsonPath('gem_upgrades.offSeasonTraining', 1)
            ->assertJsonPath('gems', 40);
        $this->postJson(route('elf-fling.purchases'), ['kind' => 'gemUpgrade', 'item' => 'offSeasonTraining'])
            ->assertJsonValidationErrors(['item' => 'That\'s already fully upgraded.']);
        $this->postJson(route('elf-fling.purchases'), ['kind' => 'gemUpgrade', 'item' => 'polarJetStream'])
            ->assertJsonPath('gem_upgrades.polarJetStream', 1)
            ->assertJsonPath('gems', 5);
        $this->postJson(route('elf-fling.purchases'), ['kind' => 'upgrade', 'item' => 'polarJetStream'])
            ->assertJsonValidationErrors(['item' => 'That isn\'t in the shop.']);
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

    public function test_a_throw_tells_everyone_watching_that_the_leaderboards_moved(): void
    {
        Event::fake([ElfFlingLeaderboardChanged::class]);
        $this->player();

        $this->postJson(route('elf-fling.throws'), ['distance' => 50, 'coins_collected' => 2])->assertOk();

        Event::assertDispatchedTimes(ElfFlingLeaderboardChanged::class, 1);
    }

    public function test_anyone_signed_in_can_watch_the_leaderboards_but_not_a_kid_or_pet(): void
    {
        $canWatch = Broadcast::driver()->getChannels()->get('elf-fling');

        $this->assertTrue($canWatch(User::factory()->create()));
        $this->assertFalse($canWatch(User::factory()->create(['managed_kind' => 'child'])));
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
