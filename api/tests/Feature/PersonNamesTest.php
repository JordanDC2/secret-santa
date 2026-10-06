<?php

namespace Tests\Feature;

use App\Models\Group;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PersonNamesTest extends TestCase
{
    use RefreshDatabase;

    private Group $group;

    private User $holly;

    protected function setUp(): void
    {
        parent::setUp();

        $this->holly = User::factory()->create(['first_name' => 'Holly', 'last_name' => 'Berry']);
        $this->group = Group::factory()->create(['owner_id' => $this->holly->id]);
    }

    public function test_group_cards_use_first_names_and_tell_namesakes_apart(): void
    {
        $nickClaus = $this->member('Nick', 'Claus');
        $nickSnow = $this->member('Nick', 'Snow');
        $ivy = $this->member('Ivy', 'Green');
        Sanctum::actingAs($this->holly);

        $names = $this->namesOnTheCard();

        $this->assertSame('Holly', $names[$this->holly->id]);
        $this->assertSame('Nick C.', $names[$nickClaus->id]);
        $this->assertSame('Nick S.', $names[$nickSnow->id]);
        $this->assertSame('Ivy', $names[$ivy->id]);
    }

    public function test_matching_initials_take_more_letters_and_no_last_name_stays_a_first_name(): void
    {
        $carter = $this->member('Nick', 'Carter');
        $cole = $this->member('Nick', 'cole');
        $justNick = $this->member('Nick', null);
        Sanctum::actingAs($this->holly);

        $names = $this->namesOnTheCard();

        $this->assertSame('Nick Ca.', $names[$carter->id]);
        $this->assertSame('Nick co.', $names[$cole->id]);
        $this->assertSame('Nick', $names[$justNick->id]);
    }

    public function test_namesakes_are_only_told_apart_within_the_same_group(): void
    {
        $nickClaus = $this->member('Nick', 'Claus');
        $otherGroup = Group::factory()->create(['owner_id' => $this->holly->id]);
        $otherGroup->members()->attach(User::factory()->create(['first_name' => 'Nick', 'last_name' => 'Snow']));
        Sanctum::actingAs($this->holly);

        $names = $this->namesOnTheCard();

        $this->assertSame('Nick', $names[$nickClaus->id]);
    }

    public function test_wishlists_and_who_you_drew_use_full_names(): void
    {
        $nick = $this->member('Nick', 'Claus');
        $this->group->update(['drawn_at' => now()]);
        $this->group->assignments()->create(['draw_number' => 1, 'giver_id' => $this->holly->id, 'receiver_id' => $nick->id]);
        $this->group->assignments()->create(['draw_number' => 1, 'giver_id' => $nick->id, 'receiver_id' => $this->holly->id]);
        Sanctum::actingAs($this->holly);

        $this->getJson(route('groups.show', $this->group))
            ->assertJsonPath('my_assignment.recipient_name', 'Nick Claus');
        $this->getJson(route('users.wishlist', $nick))
            ->assertJsonPath('user.name', 'Nick Claus')
            ->assertJsonPath('my_recipients.0.name', 'Nick Claus');
    }

    public function test_adults_need_a_last_name_but_kids_and_pets_dont(): void
    {
        $this->postJson(route('auth.register'), [
            'first_name' => 'Tinsel',
            'email' => 'tinsel@example.test',
            'password' => 'a-long-test-password-1',
            'password_confirmation' => 'a-long-test-password-1',
        ])->assertJsonValidationErrors('last_name');

        Sanctum::actingAs($this->holly);
        $this->patchJson(route('account.profile'), ['first_name' => 'Holly', 'last_name' => '', 'email' => $this->holly->email])
            ->assertJsonValidationErrors('last_name');

        $this->postJson(route('account.profiles.store'), ['first_name' => 'Biscuit', 'kind' => 'pet'])
            ->assertCreated()
            ->assertJsonPath('last_name', null)
            ->assertJsonPath('name', 'Biscuit');
        $this->postJson(route('account.profiles.store'), ['first_name' => 'Lily', 'last_name' => 'Berry', 'kind' => 'child'])
            ->assertCreated()
            ->assertJsonPath('name', 'Lily Berry');
    }

    /**
     * Each member's name on the group card, as Holly sees it, keyed by user id.
     *
     * @return array<int, string>
     */
    private function namesOnTheCard(): array
    {
        $members = $this->getJson(route('groups.show', $this->group))->assertOk()->json('members');
        $this->assertIsArray($members);

        return array_column($members, 'name', 'id');
    }

    private function member(string $firstName, ?string $lastName): User
    {
        $member = User::factory()->create(['first_name' => $firstName, 'last_name' => $lastName]);
        $this->group->members()->attach($member);

        return $member;
    }
}
