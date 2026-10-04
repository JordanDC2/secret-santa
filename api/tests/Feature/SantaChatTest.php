<?php

namespace Tests\Feature;

use App\Events\SantaChatChanged;
use App\Models\Group;
use App\Models\SantaMessage;
use App\Models\User;
use App\Notifications\SantaMessageReceived;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SantaChatTest extends TestCase
{
    use RefreshDatabase;

    private Group $group;

    /** Drew $person. */
    private User $santa;

    /** Drawn by $santa. */
    private User $person;

    /** Drawn by $person, and drew $santa. Owns the group. */
    private User $third;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
        Event::fake([SantaChatChanged::class]);

        $this->group = Group::factory()->create(['drawn_at' => now()]);
        $this->third = $this->group->owner;
        $this->santa = User::factory()->create(['name' => 'Sneaky Santa']);
        $this->person = User::factory()->create(['name' => 'Polly Person']);
        $this->group->members()->attach([$this->santa->id, $this->person->id]);

        foreach ([[$this->santa, $this->person], [$this->person, $this->third], [$this->third, $this->santa]] as [$giver, $receiver]) {
            $this->group->assignments()->create(['draw_number' => 1, 'giver_id' => $giver->id, 'receiver_id' => $receiver->id]);
        }
    }

    public function test_the_person_reads_their_santas_message_without_learning_who_sent_it(): void
    {
        Sanctum::actingAs($this->santa);
        $this->postJson(route('groups.santa-chat.store', [$this->group, 'my-person']), ['body' => 'Do you own a Kindle?'])
            ->assertNoContent();

        Sanctum::actingAs($this->person);
        $this->getJson(route('groups.santa-chat.show', [$this->group, 'my-santa']))
            ->assertOk()
            ->assertJsonPath('with', null)
            ->assertJsonPath('messages.0.body', 'Do you own a Kindle?')
            ->assertJsonPath('messages.0.mine', false)
            ->assertDontSee('Sneaky')
            ->assertDontSee($this->santa->email);

        $this->postJson(route('groups.santa-chat.store', [$this->group, 'my-santa']), ['body' => 'Nope!'])->assertNoContent();

        Sanctum::actingAs($this->santa);
        $this->getJson(route('groups.santa-chat.show', [$this->group, 'my-person']))
            ->assertOk()
            ->assertJsonPath('with.name', 'Polly Person')
            ->assertJsonPath('messages.0.mine', true)
            ->assertJsonPath('messages.1.body', 'Nope!')
            ->assertJsonPath('messages.1.mine', false);
    }

    public function test_the_group_card_counts_unread_messages_without_naming_the_santa(): void
    {
        Sanctum::actingAs($this->santa);
        $this->postJson(route('groups.santa-chat.store', [$this->group, 'my-person']), ['body' => 'Hi!']);
        $this->postJson(route('groups.santa-chat.store', [$this->group, 'my-person']), ['body' => 'Still there?']);

        Sanctum::actingAs($this->person);
        $card = $this->getJson(route('groups.show', $this->group))
            ->assertJsonPath('my_santa.unread_messages', 2)
            ->assertJsonPath('my_assignment.unread_messages', 0)
            ->json('my_santa');
        $this->assertSame(['unread_messages'], array_keys($card));

        $this->postJson(route('groups.santa-chat.read', [$this->group, 'my-santa']))->assertNoContent();
        $this->getJson(route('groups.show', $this->group))->assertJsonPath('my_santa.unread_messages', 0);
        Event::assertDispatched(SantaChatChanged::class, fn (SantaChatChanged $event) => $event->userId === $this->person->id);
    }

    public function test_only_the_first_unread_message_sends_an_email(): void
    {
        Sanctum::actingAs($this->santa);
        $this->postJson(route('groups.santa-chat.store', [$this->group, 'my-person']), ['body' => 'One']);
        $this->postJson(route('groups.santa-chat.store', [$this->group, 'my-person']), ['body' => 'Two']);
        Notification::assertSentToTimes($this->person, SantaMessageReceived::class, 1);

        Sanctum::actingAs($this->person);
        $this->postJson(route('groups.santa-chat.read', [$this->group, 'my-santa']));

        Sanctum::actingAs($this->santa);
        $this->postJson(route('groups.santa-chat.store', [$this->group, 'my-person']), ['body' => 'Three']);
        Notification::assertSentToTimes($this->person, SantaMessageReceived::class, 2);
        Notification::assertNotSentTo($this->santa, SantaMessageReceived::class);
    }

    public function test_the_persons_email_never_names_their_santa(): void
    {
        Sanctum::actingAs($this->santa);
        $this->postJson(route('groups.santa-chat.store', [$this->group, 'my-person']), ['body' => 'Hi!']);

        Notification::assertSentTo($this->person, SantaMessageReceived::class, function (SantaMessageReceived $notification) {
            $mail = $notification->toMail($this->person);
            $text = $mail->subject.' '.implode(' ', $mail->introLines).' '.$mail->actionUrl;

            return ! str_contains($text, 'Sneaky')
                && str_contains($text, 'Your Secret Santa')
                && str_ends_with($mail->actionUrl, "/?group={$this->group->id}&chat=my-santa");
        });

        Sanctum::actingAs($this->person);
        $this->postJson(route('groups.santa-chat.store', [$this->group, 'my-santa']), ['body' => 'Hello']);

        Notification::assertSentTo($this->santa, SantaMessageReceived::class, function (SantaMessageReceived $notification) {
            return str_contains($notification->toMail($this->santa)->subject, 'Polly Person wrote back');
        });
    }

    public function test_nobody_else_can_read_a_thread_not_even_the_owner(): void
    {
        Sanctum::actingAs($this->santa);
        $this->postJson(route('groups.santa-chat.store', [$this->group, 'my-person']), ['body' => 'Secret question']);

        // The owner's own threads are with other people, so this message never shows up for them.
        Sanctum::actingAs($this->third);
        foreach (['my-person', 'my-santa'] as $side) {
            $this->getJson(route('groups.santa-chat.show', [$this->group, $side]))->assertOk()->assertDontSee('Secret question');
        }
        $this->getJson(route('groups.draw.assignments', $this->group))->assertDontSee('Secret question');

        Sanctum::actingAs(User::factory()->create());
        $this->getJson(route('groups.santa-chat.show', [$this->group, 'my-santa']))->assertForbidden();
        $this->postJson(route('groups.santa-chat.store', [$this->group, 'my-person']), ['body' => 'x'])->assertForbidden();
    }

    public function test_threads_need_a_draw_and_a_real_side(): void
    {
        $undrawn = Group::factory()->create();
        Sanctum::actingAs($undrawn->owner);

        $this->getJson(route('groups.santa-chat.show', [$undrawn, 'my-santa']))->assertNotFound();
        $this->postJson(route('groups.santa-chat.store', [$undrawn, 'my-person']), ['body' => 'x'])->assertNotFound();
        $this->getJson("/api/groups/{$undrawn->id}/santa-chat/someone-else")->assertNotFound();
    }

    public function test_messages_must_have_text_and_stay_short(): void
    {
        Sanctum::actingAs($this->santa);

        $this->postJson(route('groups.santa-chat.store', [$this->group, 'my-person']), ['body' => '   '])
            ->assertJsonValidationErrors('body');
        $this->postJson(route('groups.santa-chat.store', [$this->group, 'my-person']), ['body' => str_repeat('a', 1001)])
            ->assertJsonValidationErrors('body');
    }

    public function test_a_new_draw_starts_fresh_threads_and_keeps_the_old_ones_as_history(): void
    {
        Sanctum::actingAs($this->santa);
        $this->postJson(route('groups.santa-chat.store', [$this->group, 'my-person']), ['body' => 'Last year']);

        Sanctum::actingAs($this->third);
        $this->postJson(route('groups.new-draw', $this->group))->assertOk();

        Sanctum::actingAs($this->santa);
        $this->getJson(route('groups.santa-chat.show', [$this->group, 'my-person']))->assertNotFound();

        Sanctum::actingAs($this->third);
        $this->postJson(route('groups.draw', $this->group))->assertOk();

        Sanctum::actingAs($this->person);
        $this->getJson(route('groups.santa-chat.show', [$this->group, 'my-santa']))->assertOk()->assertJsonCount(0, 'messages');
        $this->assertSame(1, SantaMessage::count());
    }

    public function test_deleting_the_group_deletes_its_threads(): void
    {
        Sanctum::actingAs($this->santa);
        $this->postJson(route('groups.santa-chat.store', [$this->group, 'my-person']), ['body' => 'Hi']);

        Sanctum::actingAs($this->third);
        $this->deleteJson(route('groups.destroy', $this->group))->assertNoContent();

        $this->assertSame(0, SantaMessage::count());
    }
}
