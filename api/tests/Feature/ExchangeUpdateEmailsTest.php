<?php

namespace Tests\Feature;

use App\Actions\Groups\NotifyMembersOfExchangeChange;
use App\Actions\ManagedProfiles\CreateManagedProfile;
use App\Jobs\SendExchangeChangeEmail;
use App\Models\Group;
use App\Models\User;
use App\Notifications\ExchangeDetailsChanged;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Testing\Fakes\QueueFake;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ExchangeUpdateEmailsTest extends TestCase
{
    use RefreshDatabase;

    private Group $group;

    private User $holly;

    private User $nick;

    /** Set by the tests that hold the emails back, to run them later. */
    private QueueFake $queue;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
        $this->holly = User::factory()->create(['first_name' => 'Holly']);
        $this->group = Group::factory()->create([
            'name' => 'Family Swap',
            'owner_id' => $this->holly->id,
            'exchange_date' => '2026-12-13',
            'budget_max' => 25,
        ]);
        $this->nick = User::factory()->create();
        $this->group->members()->attach($this->nick);
    }

    public function test_members_hear_when_the_date_or_budget_changes(): void
    {
        Sanctum::actingAs($this->holly);

        $this->patchJson(route('groups.update', $this->group), ['exchange_date' => '2026-12-20', 'budget_min' => 30, 'budget_max' => 50])
            ->assertOk();

        Notification::assertSentTo($this->nick, ExchangeDetailsChanged::class, function (ExchangeDetailsChanged $notification) {
            $mail = $notification->toMail($this->nick);
            $text = implode(' ', $mail->introLines);

            return $mail->subject === '📅 Family Swap: exchange date and budget changed'
                && str_contains($text, 'Holly updated the exchange details for **Family Swap**')
                && str_contains($text, 'Exchange date: **Sunday, December 20, 2026** (was Sunday, December 13, 2026)')
                && str_contains($text, 'Budget: **$30–$50** (was $25)');
        });
        // The owner made the change, so they don't need telling.
        Notification::assertNotSentTo($this->holly, ExchangeDetailsChanged::class);
    }

    public function test_removing_or_newly_setting_one_mentions_only_that_one(): void
    {
        Sanctum::actingAs($this->holly);

        $this->patchJson(route('groups.update', $this->group), ['budget_min' => null, 'budget_max' => null])->assertOk();

        Notification::assertSentTo($this->nick, ExchangeDetailsChanged::class, function (ExchangeDetailsChanged $notification) {
            $mail = $notification->toMail($this->nick);
            $text = implode(' ', $mail->introLines);

            return $mail->subject === '📅 Family Swap: budget changed'
                && str_contains($text, 'Budget: removed (was $25)')
                && ! str_contains($text, 'Exchange date');
        });
    }

    public function test_saves_that_dont_touch_the_date_or_budget_send_nothing(): void
    {
        Sanctum::actingAs($this->holly);

        $this->patchJson(route('groups.update', $this->group), ['name' => 'Family Swap 2026'])->assertOk();
        $this->patchJson(route('groups.update', $this->group), ['exchange_date' => '2026-12-13', 'budget_max' => 25])->assertOk();

        Notification::assertNothingSent();
    }

    public function test_kids_parents_hear_once_and_the_switch_turns_it_off(): void
    {
        $ivy = User::factory()->create();
        $lily = app(CreateManagedProfile::class)($this->nick, 'Lily', null, 'child');
        $lily->managers()->attach($ivy);
        $this->group->members()->attach($lily);
        Sanctum::actingAs($this->nick);
        $this->patchJson(route('account.email-preferences.update'), ['exchange_updates' => false])->assertOk();
        Sanctum::actingAs($this->holly);

        $this->patchJson(route('groups.update', $this->group), ['exchange_date' => '2026-12-20'])->assertOk();

        // Ivy isn't in the group but looks after Lily, who is.
        Notification::assertSentToTimes($ivy, ExchangeDetailsChanged::class, 1);
        Notification::assertNotSentTo($lily, ExchangeDetailsChanged::class);
        // Nick switched these off.
        Notification::assertNotSentTo($this->nick, ExchangeDetailsChanged::class);
    }

    public function test_quick_edits_become_one_email_against_the_original_values(): void
    {
        $this->queue = Queue::fake();
        Sanctum::actingAs($this->holly);

        $this->patchJson(route('groups.update', $this->group), ['exchange_date' => '2026-12-19'])->assertOk();
        $this->patchJson(route('groups.update', $this->group), ['name' => 'Family Swap!'])->assertOk();
        $this->patchJson(route('groups.update', $this->group), ['exchange_date' => '2026-12-20', 'budget_max' => 30])->assertOk();

        // The rename didn't restart the wait; each date or budget change queued its own email.
        Queue::assertPushed(SendExchangeChangeEmail::class, 2);
        Queue::assertPushed(
            SendExchangeChangeEmail::class,
            fn (SendExchangeChangeEmail $job) => $job->delay instanceof \DateTimeInterface
                && (int) round(now()->diffInMinutes($job->delay)) === NotifyMembersOfExchangeChange::WAIT_MINUTES,
        );

        $this->runQueuedEmails();

        Notification::assertSentToTimes($this->nick, ExchangeDetailsChanged::class, 1);
        Notification::assertSentTo($this->nick, ExchangeDetailsChanged::class, function (ExchangeDetailsChanged $notification) {
            $text = implode(' ', $notification->toMail($this->nick)->introLines);

            return str_contains($text, 'Exchange date: **Sunday, December 20, 2026** (was Sunday, December 13, 2026)')
                && str_contains($text, 'Budget: **$30** (was $25)');
        });
    }

    public function test_a_change_thats_undone_before_the_email_goes_sends_nothing(): void
    {
        $this->queue = Queue::fake();
        Sanctum::actingAs($this->holly);

        $this->patchJson(route('groups.update', $this->group), ['budget_max' => 40])->assertOk();
        $this->patchJson(route('groups.update', $this->group), ['budget_max' => 25])->assertOk();
        $this->runQueuedEmails();

        Notification::assertNothingSent();

        // The next change starts fresh, compared against what members last heard about.
        $this->patchJson(route('groups.update', $this->group), ['budget_max' => 35])->assertOk();
        $this->runQueuedEmails();

        Notification::assertSentTo($this->nick, ExchangeDetailsChanged::class, fn (ExchangeDetailsChanged $notification) => str_contains(
            implode(' ', $notification->toMail($this->nick)->introLines),
            'Budget: **$35** (was $25)',
        ));
    }

    /**
     * Runs the queued emails as the queue would once their wait is over, oldest first.
     */
    private function runQueuedEmails(): void
    {
        $this->queue->pushed(SendExchangeChangeEmail::class)->each(fn (SendExchangeChangeEmail $job) => $job->handle());
        $this->queue = Queue::fake();
    }
}
