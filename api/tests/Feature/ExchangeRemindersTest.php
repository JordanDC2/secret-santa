<?php

namespace Tests\Feature;

use App\Actions\Groups\SendExchangeReminders;
use App\Models\Group;
use App\Models\User;
use App\Models\WishlistItem;
use App\Notifications\EmptyWishlistReminder;
use App\Notifications\ShoppingReminder;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ExchangeRemindersTest extends TestCase
{
    use RefreshDatabase;

    private Group $group;

    /** Has a wishlist item. */
    private User $holly;

    /** Has an empty wishlist. */
    private User $nick;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();

        $this->group = Group::factory()->create(['name' => 'Family Swap', 'exchange_date' => '2026-12-20', 'budget_max' => 50]);
        $this->holly = $this->group->owner;
        $this->holly->update(['name' => 'Holly']);
        $this->nick = User::factory()->create(['name' => 'Nick']);
        $this->group->members()->attach($this->nick);
        WishlistItem::factory()->create(['user_id' => $this->holly->id, 'name' => 'Scarf']);
    }

    public function test_three_weeks_out_members_with_empty_wishlists_get_a_nudge(): void
    {
        $this->remindOn('2026-11-29');

        Notification::assertSentTo($this->nick, EmptyWishlistReminder::class, function (EmptyWishlistReminder $notification) {
            $mail = $notification->toMail($this->nick);

            return $notification->daysLeft === 21
                && str_contains($mail->subject, 'Family Swap')
                && str_contains(implode(' ', $mail->introLines), 'Sunday, December 20');
        });
        Notification::assertNotSentTo($this->holly, EmptyWishlistReminder::class);
    }

    public function test_received_items_and_gift_ideas_dont_count_as_a_wishlist(): void
    {
        WishlistItem::factory()->create(['user_id' => $this->nick->id, 'received_at' => now()]);
        WishlistItem::factory()->create(['user_id' => $this->nick->id, 'is_suggestion' => true, 'suggested_by_id' => $this->holly->id]);

        $this->remindOn('2026-11-29');

        Notification::assertSentTo($this->nick, EmptyWishlistReminder::class);
    }

    public function test_nothing_is_sent_before_the_window_or_on_or_after_the_day(): void
    {
        $this->remindOn('2026-11-28');
        $this->remindOn('2026-12-20');
        $this->remindOn('2026-12-21');

        Notification::assertNothingSent();
    }

    public function test_running_twice_never_sends_twice(): void
    {
        $this->drawNames();

        $this->remindOn('2026-12-06');
        $this->remindOn('2026-12-06');
        $this->remindOn('2026-12-07');

        Notification::assertSentToTimes($this->nick, EmptyWishlistReminder::class, 1);
        Notification::assertSentToTimes($this->holly, ShoppingReminder::class, 1);
    }

    public function test_two_weeks_out_each_santa_hears_about_their_person(): void
    {
        $this->drawNames();
        $this->claimFor($this->nick, $this->holly);

        $this->remindOn('2026-12-06');

        // Holly hasn't claimed anything for Nick, whose list is empty.
        Notification::assertSentTo($this->holly, ShoppingReminder::class, function (ShoppingReminder $notification) {
            $text = implode(' ', $notification->toMail($this->holly)->introLines);

            return $notification->daysLeft === 14
                && $notification->recipientName === 'Nick'
                && $notification->claimed === 0
                && str_contains($text, 'The budget is $50.')
                && str_contains($text, 'wishlist is empty')
                && ! str_contains($text, 'groups');
        });
        // Nick has claimed one of Holly's items but hasn't bought it.
        Notification::assertSentTo($this->nick, ShoppingReminder::class, function (ShoppingReminder $notification) {
            return $notification->recipientId === $this->holly->id
                && $notification->claimed === 1
                && str_contains(implode(' ', $notification->toMail($this->nick)->introLines), 'already claimed');
        });
    }

    public function test_a_santa_who_already_bought_their_gift_isnt_reminded(): void
    {
        $this->drawNames();
        $this->claimFor($this->nick, $this->holly, bought: true);

        $this->remindOn('2026-12-06');

        Notification::assertNotSentTo($this->nick, ShoppingReminder::class);
        Notification::assertSentTo($this->holly, ShoppingReminder::class);
    }

    public function test_drawing_the_same_person_in_two_groups_needs_two_gifts(): void
    {
        $this->drawNames();
        $bookClub = Group::factory()->create([
            'name' => 'Book Club',
            'owner_id' => $this->holly->id,
            'drawn_at' => now(),
            'exchange_date' => '2027-01-10',
        ]);
        $bookClub->members()->attach($this->nick);
        $bookClub->assignments()->create(['draw_number' => 1, 'giver_id' => $this->nick->id, 'receiver_id' => $this->holly->id]);
        $this->claimFor($this->nick, $this->holly, bought: true);

        $this->remindOn('2026-12-06');

        Notification::assertSentTo($this->nick, ShoppingReminder::class, function (ShoppingReminder $notification) {
            $text = implode(' ', $notification->toMail($this->nick)->introLines);

            return $notification->giftsNeeded === 2
                && $notification->claimed === 1
                && str_contains($text, 'You drew Holly in 2 groups (Book Club and Family Swap)')
                && str_contains($text, 'pick 1 more');
        });

        // A second gift bought: nothing more to remind about when Book Club's own reminder comes up.
        $this->claimFor($this->nick, $this->holly, bought: true);
        $this->remindOn('2026-12-27');

        Notification::assertSentToTimes($this->nick, ShoppingReminder::class, 1);
    }

    public function test_a_stale_draw_in_another_group_isnt_another_gift(): void
    {
        // Book Club drew last year and never started a new draw; its exchange is long past.
        $bookClub = Group::factory()->create([
            'name' => 'Book Club',
            'owner_id' => $this->holly->id,
            'drawn_at' => now()->subYear(),
            'exchange_date' => now()->subYear()->addMonth()->toDateString(),
        ]);
        $bookClub->members()->attach($this->nick);
        $bookClub->assignments()->create(['draw_number' => 1, 'giver_id' => $this->nick->id, 'receiver_id' => $this->holly->id]);
        $this->claimFor($this->nick, $this->holly, bought: true, at: now()->subYear()->addDay());
        // One with no date counts no more than one that's passed.
        $undated = Group::factory()->create(['owner_id' => $this->holly->id, 'drawn_at' => now()->subYear()]);
        $undated->assignments()->create(['draw_number' => 1, 'giver_id' => $this->nick->id, 'receiver_id' => $this->holly->id]);
        $this->drawNames();

        $this->remindOn('2026-12-06');

        Notification::assertSentTo($this->nick, ShoppingReminder::class, fn (ShoppingReminder $notification) => $notification->giftsNeeded === 1
            && $notification->drawnInGroups === ['Family Swap']
            && $notification->claimed === 0);

        $this->claimFor($this->nick, $this->holly, bought: true);
        $this->group->update(['exchange_date' => '2026-12-21']);
        $this->remindOn('2026-12-07');

        Notification::assertSentToTimes($this->nick, ShoppingReminder::class, 1);
    }

    public function test_last_years_shopping_doesnt_count_toward_this_years_gift(): void
    {
        // Bought for an earlier exchange, before this year's names were drawn. Claims never lapse.
        $this->claimFor($this->nick, $this->holly, bought: true, at: now()->subYear());
        $this->drawNames();

        $this->remindOn('2026-12-06');

        Notification::assertSentTo($this->nick, ShoppingReminder::class, fn (ShoppingReminder $notification) => $notification->claimed === 0);
    }

    public function test_gifts_already_received_dont_count(): void
    {
        $this->drawNames();
        $this->claimFor($this->nick, $this->holly, bought: true, received: true);

        $this->remindOn('2026-12-06');

        Notification::assertSentTo($this->nick, ShoppingReminder::class);
    }

    public function test_the_shopping_reminder_waits_for_names_to_be_drawn(): void
    {
        $this->remindOn('2026-12-06');
        Notification::assertNotSentTo($this->holly, ShoppingReminder::class);

        $this->drawNames();
        $this->remindOn('2026-12-08');

        Notification::assertSentTo($this->holly, ShoppingReminder::class, fn (ShoppingReminder $notification) => $notification->daysLeft === 12);
    }

    public function test_moving_the_exchange_sends_fresh_reminders(): void
    {
        $this->remindOn('2026-11-29');
        $this->group->update(['exchange_date' => '2027-01-03']);
        $this->remindOn('2026-12-13');

        Notification::assertSentToTimes($this->nick, EmptyWishlistReminder::class, 2);
    }

    public function test_reminders_are_scheduled_each_morning_in_the_organizers_timezone(): void
    {
        $event = collect(app(Schedule::class)->events())
            ->first(fn ($event) => str_contains((string) $event->command, 'app:send-exchange-reminders'));

        $this->assertNotNull($event);
        $this->assertSame('0 9 * * *', $event->expression);
        $this->assertSame(config('app.reminder_timezone'), $event->timezone);
    }

    private function remindOn(string $date): void
    {
        app(SendExchangeReminders::class)(Carbon::parse($date));
    }

    /** A new item on the owner's list, claimed by the giver (and maybe bought) at the given time. */
    private function claimFor(User $giver, User $owner, bool $bought = false, bool $received = false, ?Carbon $at = null): void
    {
        $at ??= now();
        $item = WishlistItem::factory()->create(['user_id' => $owner->id, 'received_at' => $received ? $at : null]);
        $item->claims()->create([
            'user_id' => $giver->id,
            'quantity' => 1,
            'claimed_at' => $at,
            'purchased_at' => $bought ? $at : null,
        ]);
    }

    private function drawNames(): void
    {
        $this->group->update(['drawn_at' => now()]);
        $this->group->assignments()->create(['draw_number' => 1, 'giver_id' => $this->holly->id, 'receiver_id' => $this->nick->id]);
        $this->group->assignments()->create(['draw_number' => 1, 'giver_id' => $this->nick->id, 'receiver_id' => $this->holly->id]);
    }
}
