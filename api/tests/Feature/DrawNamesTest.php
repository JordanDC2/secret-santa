<?php

namespace Tests\Feature;

use App\Models\Group;
use App\Models\User;
use App\Notifications\SecretSantaAssigned;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\SendQueuedNotifications;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DrawNamesTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_drawing_names_emails_each_member_someone_other_than_themselves(): void
    {
        Notification::fake();
        $group = $this->groupWithMembers(3);

        Sanctum::actingAs($group->owner);

        $this->postJson(route('groups.draw', $group))
            ->assertOk()
            ->assertJsonPath('is_drawn', true);

        foreach ($group->members as $member) {
            Notification::assertSentTo(
                $member,
                SecretSantaAssigned::class,
                fn (SecretSantaAssigned $notification) => $notification->recipient->isNot($member),
            );
        }

        Notification::assertCount(4);
    }

    public function test_assignment_email_links_to_the_recipients_wishlist(): void
    {
        Notification::fake();
        $group = $this->groupWithMembers(1);

        Sanctum::actingAs($group->owner);

        $this->postJson(route('groups.draw', $group))->assertOk();

        Notification::assertSentTo($group->owner, SecretSantaAssigned::class, function (SecretSantaAssigned $notification) use ($group) {
            return $notification->toMail($group->owner)->actionUrl
                === config('app.frontend_url')."/wishlists/{$notification->recipient->id}";
        });
    }

    public function test_assignment_emails_are_queued_rather_than_sent_inline(): void
    {
        Queue::fake();
        $group = $this->groupWithMembers(2);

        Sanctum::actingAs($group->owner);

        $this->postJson(route('groups.draw', $group))->assertOk();

        Queue::assertPushed(SendQueuedNotifications::class, 3);
    }

    public function test_non_owner_cannot_draw_names(): void
    {
        Notification::fake();
        $group = $this->groupWithMembers(2);

        Sanctum::actingAs($group->members->firstWhere('id', '!=', $group->owner_id));

        $this->postJson(route('groups.draw', $group))->assertForbidden();

        $this->assertFalse($group->fresh()->is_drawn);
        Notification::assertNothingSent();
    }

    public function test_a_group_with_only_its_owner_cannot_be_drawn(): void
    {
        Notification::fake();
        $group = Group::factory()->create();

        Sanctum::actingAs($group->owner);

        $this->postJson(route('groups.draw', $group))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('group');

        Notification::assertNothingSent();
    }

    private function groupWithMembers(int $additionalMembers): Group
    {
        $group = Group::factory()->create();
        $group->members()->attach(User::factory()->count($additionalMembers)->create());

        return $group->load('members');
    }
}
