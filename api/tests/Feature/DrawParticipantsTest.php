<?php

namespace Tests\Feature;

use App\Actions\Groups\SendExchangeReminders;
use App\Actions\ManagedProfiles\CreateManagedProfile;
use App\Models\Group;
use App\Models\User;
use App\Notifications\EmptyWishlistReminder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DrawParticipantsTest extends TestCase
{
    use RefreshDatabase;

    private Group $group;

    private User $holly;

    private User $nick;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
        $this->group = Group::factory()->create(['name' => 'Pet Swap']);
        $this->holly = $this->group->owner;
        $this->nick = User::factory()->create(['name' => 'Nick']);
        $this->group->members()->attach($this->nick);
    }

    public function test_everyone_starts_in_the_draw_and_the_owner_can_sit_someone_out(): void
    {
        Sanctum::actingAs($this->holly);
        $this->getJson(route('groups.show', $this->group))->assertJsonPath('members.1.in_draw', true);

        $this->patchJson(route('groups.members.in-draw', [$this->group, $this->nick]), ['in_draw' => false])
            ->assertOk()
            ->assertJsonPath('members.1.in_draw', false);

        $this->patchJson(route('groups.members.in-draw', [$this->group, $this->nick]), ['in_draw' => true])
            ->assertJsonPath('members.1.in_draw', true);
    }

    public function test_the_owner_can_switch_everyone_off_or_on_at_once(): void
    {
        Sanctum::actingAs($this->holly);

        $this->patchJson(route('groups.in-draw', $this->group), ['in_draw' => false])
            ->assertOk()
            ->assertJsonPath('members.0.in_draw', false)
            ->assertJsonPath('members.1.in_draw', false);
        $this->patchJson(route('groups.in-draw', $this->group), ['in_draw' => true])->assertJsonPath('members.1.in_draw', true);

        Sanctum::actingAs($this->nick);
        $this->patchJson(route('groups.in-draw', $this->group), ['in_draw' => false])->assertForbidden();

        $this->group->update(['drawn_at' => now()]);
        Sanctum::actingAs($this->holly);
        $this->patchJson(route('groups.in-draw', $this->group), ['in_draw' => false])->assertJsonValidationErrors('in_draw');
    }

    public function test_only_the_owner_only_members_only_before_the_draw(): void
    {
        Sanctum::actingAs($this->nick);
        $this->patchJson(route('groups.members.in-draw', [$this->group, $this->holly]), ['in_draw' => false])->assertForbidden();

        Sanctum::actingAs($this->holly);
        $this->patchJson(route('groups.members.in-draw', [$this->group, User::factory()->create()]), ['in_draw' => false])->assertNotFound();
        $this->patchJson(route('groups.members.in-draw', [$this->group, $this->nick]), ['in_draw' => 'maybe'])->assertJsonValidationErrors('in_draw');

        $this->group->update(['drawn_at' => now()]);
        $this->patchJson(route('groups.members.in-draw', [$this->group, $this->nick]), ['in_draw' => false])
            ->assertJsonValidationErrors(['in_draw' => 'Start a new draw']);
    }

    public function test_a_pets_only_draw_matches_pets_with_pets(): void
    {
        $biscuit = app(CreateManagedProfile::class)($this->holly, 'Biscuit', 'pet');
        $rex = app(CreateManagedProfile::class)($this->nick, 'Rex', 'pet');
        $this->group->members()->attach([$biscuit->id, $rex->id]);
        $this->group->members()->updateExistingPivot($this->holly->id, ['in_draw' => false]);
        $this->group->members()->updateExistingPivot($this->nick->id, ['in_draw' => false]);
        Sanctum::actingAs($this->holly);

        $this->postJson(route('groups.draw', $this->group))->assertOk();

        $pairs = $this->group->currentAssignments()->get()->map(fn ($a) => [$a->giver_id, $a->receiver_id])->all();
        $this->assertEqualsCanonicalizing([[$biscuit->id, $rex->id], [$rex->id, $biscuit->id]], $pairs);

        $card = $this->getJson(route('groups.show', $this->group))
            ->assertJsonPath('my_assignment', null)
            ->assertJsonPath('my_santa', null)
            ->assertJsonPath('managed_assignments.0.recipient.name', 'Rex');
        $this->assertSame('Biscuit', $card->json('managed_assignments.0.profile.name'));
        $this->getJson(route('groups.draw.check', $this->group))->assertJsonPath('verified', true);
    }

    public function test_exclusions_are_only_between_people_in_the_draw(): void
    {
        $ivy = User::factory()->create();
        $this->group->members()->attach($ivy);
        $this->group->members()->updateExistingPivot($this->nick->id, ['in_draw' => false]);
        Sanctum::actingAs($this->holly);

        $this->postJson(route('groups.exclusions.store', $this->group), ['giver_id' => $this->holly->id, 'receiver_id' => $this->nick->id, 'mutual' => true])
            ->assertJsonValidationErrors(['giver_id' => 'in the draw']);
        // With Nick out, Holly and Ivy are the only two: excluding them leaves no way to match.
        $this->postJson(route('groups.exclusions.store', $this->group), ['giver_id' => $this->holly->id, 'receiver_id' => $ivy->id, 'mutual' => true])
            ->assertJsonValidationErrors(['giver_id' => 'no way to match']);
    }

    public function test_a_draw_needs_two_people_in_it(): void
    {
        $this->group->members()->updateExistingPivot($this->nick->id, ['in_draw' => false]);
        Sanctum::actingAs($this->holly);

        $this->postJson(route('groups.draw', $this->group))
            ->assertJsonValidationErrors(['group' => 'At least 2 people need to be in the draw']);
    }

    public function test_reminders_skip_people_sitting_out_and_a_new_draw_keeps_the_choice(): void
    {
        $this->group->update(['exchange_date' => '2026-12-20']);
        $this->group->members()->updateExistingPivot($this->nick->id, ['in_draw' => false]);

        app(SendExchangeReminders::class)(Carbon::parse('2026-11-29'));

        Notification::assertSentTo($this->holly, EmptyWishlistReminder::class);
        Notification::assertNotSentTo($this->nick, EmptyWishlistReminder::class);

        $this->group->members()->attach(User::factory()->create());
        $this->group->update(['drawn_at' => now()]);
        Sanctum::actingAs($this->holly);
        $this->postJson(route('groups.new-draw', $this->group))->assertOk();
        $this->getJson(route('groups.show', $this->group))->assertJsonPath('members.1.in_draw', false);
    }
}
