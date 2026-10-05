<?php

namespace Tests\Feature;

use App\Models\Group;
use App\Models\User;
use App\Notifications\SecretSantaAssigned;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ExchangeDetailsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
    }

    public function test_the_owner_sets_an_exchange_date_and_a_single_budget(): void
    {
        $group = Group::factory()->create();
        Sanctum::actingAs($group->owner);

        $date = now()->addMonths(2)->toDateString();
        $this->patchJson(route('groups.update', $group), ['exchange_date' => $date, 'budget_min' => null, 'budget_max' => 50])
            ->assertOk()
            ->assertJsonPath('exchange_date', $date)
            ->assertJsonPath('budget', ['min' => null, 'max' => 50]);

        $this->assertSame('$50', $group->fresh()?->budgetLabel());
    }

    public function test_a_budget_can_be_a_range_and_everything_can_be_cleared(): void
    {
        $group = Group::factory()->create();
        Sanctum::actingAs($group->owner);

        $this->patchJson(route('groups.update', $group), ['budget_min' => 30, 'budget_max' => 50])
            ->assertOk()
            ->assertJsonPath('budget', ['min' => 30, 'max' => 50]);
        $this->assertSame('$30–$50', $group->fresh()?->budgetLabel());

        $this->patchJson(route('groups.update', $group), ['exchange_date' => null, 'budget_min' => null, 'budget_max' => null])
            ->assertOk()
            ->assertJsonPath('exchange_date', null)
            ->assertJsonPath('budget', null);
    }

    public function test_budgets_and_dates_are_validated(): void
    {
        $group = Group::factory()->create();
        Sanctum::actingAs($group->owner);

        $this->patchJson(route('groups.update', $group), ['budget_min' => 50, 'budget_max' => 30])
            ->assertJsonValidationErrors(['budget_min' => 'low end']);
        $this->patchJson(route('groups.update', $group), ['budget_min' => 30, 'budget_max' => null])
            ->assertJsonValidationErrors(['budget_max' => 'high end']);
        $this->patchJson(route('groups.update', $group), ['budget_max' => 0])->assertJsonValidationErrors('budget_max');
        $this->patchJson(route('groups.update', $group), ['budget_max' => 12.5])->assertJsonValidationErrors('budget_max');
        $this->patchJson(route('groups.update', $group), ['exchange_date' => 'Dec 20'])->assertJsonValidationErrors('exchange_date');
    }

    public function test_a_new_exchange_date_must_be_between_today_and_two_years_out(): void
    {
        $group = Group::factory()->create();
        Sanctum::actingAs($group->owner);

        $this->patchJson(route('groups.update', $group), ['exchange_date' => '1927-08-19'])
            ->assertJsonValidationErrors(['exchange_date' => "hasn't passed"]);
        $this->patchJson(route('groups.update', $group), ['exchange_date' => now()->addYears(3)->toDateString()])
            ->assertJsonValidationErrors(['exchange_date' => 'two years']);
        $this->patchJson(route('groups.update', $group), ['exchange_date' => now()->toDateString()])->assertOk();
    }

    public function test_a_passed_exchange_keeps_its_date_when_the_budget_changes(): void
    {
        $group = Group::factory()->create(['exchange_date' => now()->subMonth()->toDateString(), 'budget_max' => 20]);
        Sanctum::actingAs($group->owner);

        $this->patchJson(route('groups.update', $group), [
            'exchange_date' => now()->subMonth()->toDateString(),
            'budget_min' => null,
            'budget_max' => 25,
        ])->assertOk()->assertJsonPath('budget.max', 25);
    }

    public function test_only_the_owner_sets_exchange_details(): void
    {
        $group = Group::factory()->create();
        $member = User::factory()->create();
        $group->members()->attach($member);
        Sanctum::actingAs($member);

        $this->patchJson(route('groups.update', $group), ['exchange_date' => now()->addMonth()->toDateString()])->assertForbidden();
    }

    public function test_the_assignment_email_and_your_persons_wishlist_mention_the_date_and_budget(): void
    {
        $date = now()->addMonths(2);
        $group = Group::factory()->create(['exchange_date' => $date->toDateString(), 'budget_min' => 30, 'budget_max' => 50]);
        $friend = User::factory()->create();
        $group->members()->attach($friend);
        Sanctum::actingAs($group->owner);

        $this->postJson(route('groups.draw', $group))->assertOk();

        Notification::assertSentTo($group->owner, SecretSantaAssigned::class, fn (SecretSantaAssigned $notification) => in_array(
            "The exchange is on {$date->format('l, F j')}, and the budget is \$30–\$50.",
            $notification->toMail($group->owner)->introLines,
            true,
        ));

        $this->getJson(route('users.wishlist', $friend))
            ->assertJsonPath('my_recipients.0.group.exchange_date', $date->toDateString())
            ->assertJsonPath('my_recipients.0.group.budget', '$30–$50');
    }

    public function test_your_persons_wishlist_forgets_groups_whose_exchange_has_passed(): void
    {
        $person = User::factory()->create(['name' => 'Ivy']);
        $santa = User::factory()->create();
        $groups = [
            'past' => Group::factory()->create(['name' => 'Last Year', 'exchange_date' => now()->subMonth()->toDateString()]),
            'today' => Group::factory()->create(['name' => 'Today', 'exchange_date' => now()->toDateString()]),
            'undated' => Group::factory()->create(['name' => 'Undated']),
        ];
        foreach ($groups as $group) {
            $group->members()->attach([$person->id, $santa->id]);
            $group->update(['drawn_at' => now()]);
            $group->assignments()->create(['draw_number' => 1, 'giver_id' => $santa->id, 'receiver_id' => $person->id]);
        }
        Sanctum::actingAs($santa);

        $names = $this->getJson(route('users.wishlist', $person))->assertOk()->collect('my_recipients')->pluck('group.name')->sort()->values()->all();

        $this->assertSame(['Today', 'Undated'], $names);
    }

    public function test_the_assignment_email_leaves_details_out_when_none_are_set(): void
    {
        $group = Group::factory()->create();
        $group->members()->attach(User::factory()->create());
        Sanctum::actingAs($group->owner);

        $this->postJson(route('groups.draw', $group))->assertOk();

        Notification::assertSentTo($group->owner, SecretSantaAssigned::class, fn (SecretSantaAssigned $notification) => ! str_contains(
            implode(' ', $notification->toMail($group->owner)->introLines),
            'exchange is on',
        ));
    }
}
