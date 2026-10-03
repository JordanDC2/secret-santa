<?php

namespace Tests\Feature;

use App\Models\Group;
use App\Models\User;
use App\Models\WishlistItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RepeatDrawsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
    }

    public function test_owner_can_start_a_new_draw_and_the_old_one_is_kept(): void
    {
        $group = $this->groupOf(3);
        Sanctum::actingAs($group->owner);
        $this->postJson(route('groups.draw', $group))->assertOk();

        $this->postJson(route('groups.new-draw', $group))
            ->assertOk()
            ->assertJsonPath('is_drawn', false)
            ->assertJsonPath('has_previous_draw', true)
            ->assertJsonPath('my_assignment', null);

        $this->assertSame(2, $group->fresh()->draw_number);
        $this->assertSame(3, $group->assignments()->where('draw_number', 1)->count());
        $this->assertSame(3, $group->members()->count());

        $this->postJson(route('groups.draw', $group))->assertOk()->assertJsonPath('is_drawn', true);
        $this->assertSame(3, $group->assignments()->where('draw_number', 2)->count());
    }

    public function test_only_the_owner_can_start_a_new_draw_and_only_after_drawing(): void
    {
        $group = $this->groupOf(3);
        Sanctum::actingAs($group->owner);

        $this->postJson(route('groups.new-draw', $group))->assertUnprocessable()->assertJsonValidationErrors('group');

        $this->postJson(route('groups.draw', $group))->assertOk();
        Sanctum::actingAs($group->members()->where('users.id', '!=', $group->owner_id)->first());

        $this->postJson(route('groups.new-draw', $group))->assertForbidden();
    }

    public function test_a_new_draw_avoids_last_draws_matches_by_default(): void
    {
        $group = $this->groupOf(5);
        Sanctum::actingAs($group->owner);

        for ($draw = 1; $draw <= 10; $draw++) {
            $this->postJson(route('groups.draw', $group))->assertOk();
            $group->refresh();

            if ($draw > 1) {
                $previous = $group->assignments()->where('draw_number', $draw - 1)->pluck('receiver_id', 'giver_id');
                $current = $group->currentAssignments()->pluck('receiver_id', 'giver_id');

                foreach ($current as $giver => $receiver) {
                    $this->assertNotSame($previous[$giver], $receiver, "Draw {$draw} repeated last draw's match.");
                }
            }

            $this->postJson(route('groups.new-draw', $group))->assertOk();
        }
    }

    public function test_avoiding_last_draw_can_be_turned_off_when_it_is_impossible(): void
    {
        // With two people the only possible draw is the same one again.
        $group = $this->groupOf(2);
        Sanctum::actingAs($group->owner);
        $this->postJson(route('groups.draw', $group))->assertOk();
        $this->postJson(route('groups.new-draw', $group))->assertOk();

        $this->postJson(route('groups.draw', $group))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['group' => "Avoiding last draw's matches"]);

        $this->postJson(route('groups.draw', $group), ['avoid_previous_matches' => false])->assertOk();
    }

    public function test_wishlist_banners_only_use_current_draws_and_name_the_group(): void
    {
        $group = $this->groupOf(3);
        Sanctum::actingAs($group->owner);
        $this->postJson(route('groups.draw', $group))->assertOk();
        $recipient = $group->currentAssignments()->where('giver_id', $group->owner_id)->first()->receiver;

        $this->getJson(route('users.wishlist', $recipient))
            ->assertJsonPath('my_recipients.0.id', $recipient->id)
            ->assertJsonPath('my_recipients.0.group.name', $group->name);

        $this->postJson(route('groups.new-draw', $group))->assertOk();

        $this->getJson(route('users.wishlist', $recipient))->assertJsonPath('my_recipients', []);
    }

    public function test_claims_survive_a_new_draw(): void
    {
        $group = $this->groupOf(3);
        [$wisher, $claimer] = $group->members()->where('users.id', '!=', $group->owner_id)->get()->all();
        $item = WishlistItem::factory()->for($wisher, 'owner')->claimedBy($claimer)->create();
        Sanctum::actingAs($group->owner);
        $this->postJson(route('groups.draw', $group))->assertOk();

        $this->postJson(route('groups.new-draw', $group))->assertOk();

        $this->assertSame([$claimer->id], $item->claims()->pluck('user_id')->all());
    }

    private function groupOf(int $size): Group
    {
        $group = Group::factory()->create();
        $group->members()->attach(User::factory()->count($size - 1)->create());

        return $group;
    }
}
