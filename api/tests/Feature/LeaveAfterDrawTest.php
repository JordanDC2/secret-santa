<?php

namespace Tests\Feature;

use App\Models\Group;
use App\Models\SecretSantaAssignment;
use App\Models\User;
use App\Notifications\MemberLeftDrawnGroup;
use App\Notifications\SecretSantaPersonChanged;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LeaveAfterDrawTest extends TestCase
{
    use RefreshDatabase;

    private Group $group;

    /** @var array<string, User> */
    private array $people;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
        $holly = User::factory()->create(['first_name' => 'Holly']);
        $this->group = Group::factory()->create(['owner_id' => $holly->id, 'exchange_date' => now()->addMonth()->toDateString()]);
        $this->people = ['holly' => $holly];
        foreach (['nick', 'ivy', 'tinsel'] as $name) {
            $this->people[$name] = User::factory()->create(['first_name' => ucfirst($name)]);
            $this->group->members()->attach($this->people[$name]);
        }
    }

    public function test_their_santa_takes_over_their_person(): void
    {
        // Holly → Nick → Ivy → Tinsel → Holly. Ivy leaves: Nick now buys for Tinsel.
        $this->draw(['holly', 'nick', 'ivy', 'tinsel']);
        $nicksChat = $this->assignment('nick', 'ivy')->messages()->create(['from_santa' => true, 'body' => 'Hi Ivy!']);
        Sanctum::actingAs($this->people['ivy']);

        $this->postJson(route('groups.leave', $this->group))->assertNoContent();

        $this->assertSame(
            [['holly', 'nick'], ['nick', 'tinsel'], ['tinsel', 'holly']],
            $this->currentPairs(),
        );
        $this->assertModelMissing($nicksChat);
        Notification::assertSentTo($this->people['nick'], SecretSantaPersonChanged::class, function (SecretSantaPersonChanged $notification) {
            $mail = $notification->toMail($this->people['nick']);
            $text = implode(' ', array_map('strval', $mail->introLines));

            return $notification->recipient->is($this->people['tinsel'])
                && $mail->subject === "🎁 Your Secret Santa person changed in {$this->group->name}"
                && str_contains($text, 'Ivy left')
                && str_contains($text, e($this->people['tinsel']->full_name));
        });
        // Nobody else's match changed, so nobody else hears anything.
        Notification::assertSentTimes(SecretSantaPersonChanged::class, 1);
        Notification::assertNothingSentTo($this->group->owner);
    }

    public function test_the_owner_redraws_when_their_santa_and_person_are_the_same(): void
    {
        // Holly ↔ Nick, Ivy ↔ Tinsel. Nick leaves: Holly can't draw herself.
        $this->draw(['holly', 'nick']);
        $this->draw(['ivy', 'tinsel']);
        Sanctum::actingAs($this->people['nick']);

        $this->postJson(route('groups.leave', $this->group))->assertNoContent();

        $this->assertSame([['ivy', 'tinsel'], ['tinsel', 'ivy']], $this->currentPairs());
        Notification::assertSentTo($this->group->owner, MemberLeftDrawnGroup::class, fn (MemberLeftDrawnGroup $notification) => $notification->toMail($this->group->owner)->subject === "❄️ Nick left {$this->group->name}: time for a new draw");
        Notification::assertNotSentTo($this->people['holly'], SecretSantaPersonChanged::class);
    }

    public function test_the_owner_redraws_when_an_exclusion_is_in_the_way(): void
    {
        $this->draw(['holly', 'nick', 'ivy', 'tinsel']);
        $this->group->exclusions()->create(['giver_id' => $this->people['nick']->id, 'receiver_id' => $this->people['tinsel']->id, 'mutual' => false]);
        Sanctum::actingAs($this->people['ivy']);

        $this->postJson(route('groups.leave', $this->group))->assertNoContent();

        Notification::assertSentTo($this->group->owner, MemberLeftDrawnGroup::class);
        Notification::assertNotSentTo($this->people['nick'], SecretSantaPersonChanged::class);
    }

    public function test_after_the_exchange_they_just_leave(): void
    {
        $this->draw(['holly', 'nick', 'ivy', 'tinsel']);
        $this->group->update(['exchange_date' => now()->subDay()->toDateString()]);
        Sanctum::actingAs($this->people['ivy']);

        $this->postJson(route('groups.leave', $this->group))->assertNoContent();

        $this->assertDatabaseMissing('group_user', ['group_id' => $this->group->id, 'user_id' => $this->people['ivy']->id]);
        // Last year's draw stays as it was.
        $this->assertCount(4, $this->currentPairs());
        Notification::assertNothingSent();
    }

    public function test_someone_sitting_the_draw_out_just_leaves(): void
    {
        $this->draw(['holly', 'nick', 'ivy']);
        Sanctum::actingAs($this->people['tinsel']);

        $this->postJson(route('groups.leave', $this->group))->assertNoContent();

        $this->assertCount(3, $this->currentPairs());
        Notification::assertNothingSent();
    }

    /**
     * Draws the given people in a ring: each buys for the next, and the last for the first.
     *
     * @param  array<int, string>  $names
     */
    private function draw(array $names): void
    {
        $this->group->update(['drawn_at' => now()]);
        foreach ($names as $index => $name) {
            $this->group->assignments()->create([
                'draw_number' => $this->group->draw_number,
                'giver_id' => $this->people[$name]->id,
                'receiver_id' => $this->people[$names[($index + 1) % count($names)]]->id,
            ]);
        }
    }

    private function assignment(string $giver, string $receiver): SecretSantaAssignment
    {
        return $this->group->currentAssignments()
            ->where('giver_id', $this->people[$giver]->id)
            ->where('receiver_id', $this->people[$receiver]->id)
            ->firstOrFail();
    }

    /**
     * @return array<int, array{0: string, 1: string}>
     */
    private function currentPairs(): array
    {
        $names = array_flip(array_map(fn (User $person) => $person->id, $this->people));

        return $this->group->currentAssignments()->get()
            ->map(fn ($assignment) => [$names[$assignment->giver_id], $names[$assignment->receiver_id]])
            ->sort()
            ->values()
            ->all();
    }
}
