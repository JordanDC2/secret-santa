<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\EmailKind;
use App\Notifications\ResetPasswordLink;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\HasApiTokens;

/**
 * @property array<string, bool>|null $email_preferences Kinds of optional email turned off (missing means on).
 * @property string|null $managed_kind "child" or "pet" for a managed profile (no login of its own).
 */
#[Fillable(['name', 'email', 'password', 'email_preferences', 'managed_kind'])]
#[Hidden(['password', 'remember_token', 'email_preferences'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /** @var array<int, int>|null See managedProfileIds(). */
    private ?array $managedProfileIdsCache = null;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'email_preferences' => 'array',
        ];
    }

    /**
     * Whether this kind of optional email is on for them. Everything is on until turned off.
     */
    public function wantsEmail(EmailKind $kind): bool
    {
        return ($this->email_preferences[$kind->value] ?? true) === true;
    }

    /**
     * Every kind of optional email and whether it's on, e.g. ['santa_chat' => false, ...].
     *
     * @return array<string, bool>
     */
    public function emailPreferences(): array
    {
        return collect(EmailKind::cases())
            ->mapWithKeys(fn (EmailKind $kind) => [$kind->value => $this->wantsEmail($kind)])
            ->all();
    }

    /**
     * @return HasMany<Group, $this>
     */
    public function ownedGroups(): HasMany
    {
        return $this->hasMany(Group::class, 'owner_id');
    }

    /**
     * @return BelongsToMany<Group, $this>
     */
    public function groups(): BelongsToMany
    {
        return $this->belongsToMany(Group::class)->withTimestamps();
    }

    public function sendPasswordResetNotification(#[\SensitiveParameter] $token): void
    {
        // A managed profile has no login, so there's nothing to reset.
        if (! $this->isManagedProfile()) {
            $this->notify(new ResetPasswordLink($token));
        }
    }

    /**
     * Where this user's emails go. A managed profile's placeholder address can't receive mail,
     * so its emails go to the people who manage it.
     *
     * @return string|array<int, string>
     */
    public function routeNotificationForMail(): string|array
    {
        return $this->isManagedProfile() ? $this->managers()->pluck('email')->all() : $this->email;
    }

    /**
     * A kid or pet without a login, whose wishlist (and later, groups) someone else looks after.
     */
    public function isManagedProfile(): bool
    {
        return $this->managed_kind !== null;
    }

    /**
     * The people looking after this managed profile.
     *
     * @return BelongsToMany<User, $this>
     */
    public function managers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'profile_managers', 'profile_id', 'manager_id')->withTimestamps();
    }

    /**
     * The kids and pets this user looks after.
     *
     * @return BelongsToMany<User, $this>
     */
    public function managedProfiles(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'profile_managers', 'manager_id', 'profile_id')->withTimestamps();
    }

    public function manages(User|int $profile): bool
    {
        return in_array($profile instanceof User ? $profile->id : $profile, $this->managedProfileIds(), true);
    }

    /**
     * Whether this user looks after the given list: their own, or a profile they manage.
     */
    public function actsFor(User|int $owner): bool
    {
        return ($owner instanceof User ? $owner->id : $owner) === $this->id || $this->manages($owner);
    }

    /**
     * The people who act for this user: themselves, or for a kid or pet (who never signs in),
     * the people looking after them. They're who shops for whoever a kid drew, and whose
     * browsers should hear about the kid's chats.
     *
     * @return array<int, int>
     */
    public function actingUserIds(): array
    {
        return $this->isManagedProfile() ? $this->managers()->pluck('users.id')->all() : [$this->id];
    }

    /**
     * Looked up once per request: policies and resources ask for every item on a list.
     *
     * @return array<int, int>
     */
    public function managedProfileIds(): array
    {
        return $this->managedProfileIdsCache ??= $this->managedProfiles()->pluck('users.id')->all();
    }

    /**
     * The user's own wishlist. Never includes suggestions others made for them: those are
     * a surprise, so anything built for the owner starts from here and can't leak them.
     *
     * @return HasMany<WishlistItem, $this>
     */
    public function wishlistItems(): HasMany
    {
        return $this->hasMany(WishlistItem::class)->where('is_suggestion', false);
    }

    /**
     * Gift ideas other people added to this user's list. Never show these to the user.
     *
     * @return HasMany<WishlistItem, $this>
     */
    public function suggestedItems(): HasMany
    {
        return $this->hasMany(WishlistItem::class)->where('is_suggestion', true)->whereNull('received_at');
    }

    /**
     * @return HasMany<WishlistClaim, $this>
     */
    public function wishlistClaims(): HasMany
    {
        return $this->hasMany(WishlistClaim::class);
    }

    /**
     * Ids of everyone in at least one of this user's groups (including this user).
     *
     * @return array<int>
     */
    public function groupMateIds(): array
    {
        return DB::table('group_user')
            ->whereIn('group_id', $this->groups()->select('groups.id'))
            ->distinct()
            ->pluck('user_id')
            ->all();
    }

    /**
     * Sign this user out everywhere except (optionally) the current session, so a password
     * change or reset also locks out anyone who got into the account.
     */
    public function endOtherSessions(?string $keepSessionId = null): void
    {
        if (config('session.driver') !== 'database') {
            return;
        }

        DB::table(config('session.table', 'sessions'))
            ->where('user_id', $this->id)
            ->when($keepSessionId, fn ($query) => $query->where('id', '!=', $keepSessionId))
            ->delete();
    }

    public function sharesGroupWith(User $other): bool
    {
        return $this->groups()
            ->whereHas('members', fn ($members) => $members->whereKey($other->id))
            ->exists();
    }

    /**
     * This user's current Secret Santa assignments (who they're buying for, and in which
     * group), across every group whose names are currently drawn.
     *
     * @return Collection<int, SecretSantaAssignment>
     */
    public function secretSantaRecipients(): Collection
    {
        return SecretSantaAssignment::query()
            ->select('secret_santa_assignments.*')
            ->join('groups', 'groups.id', '=', 'secret_santa_assignments.group_id')
            ->where('secret_santa_assignments.giver_id', $this->id)
            // Only each group's current, drawn round: old rounds and reset groups don't count.
            ->whereNotNull('groups.drawn_at')
            ->whereColumn('secret_santa_assignments.draw_number', 'groups.draw_number')
            ->with('receiver', 'group')
            ->get()
            ->sortBy(fn (SecretSantaAssignment $assignment) => [$assignment->receiver->name, $assignment->group->name])
            ->values();
    }
}
