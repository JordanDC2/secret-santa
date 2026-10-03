<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
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

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

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
        ];
    }

    public function ownedGroups(): HasMany
    {
        return $this->hasMany(Group::class, 'owner_id');
    }

    public function groups(): BelongsToMany
    {
        return $this->belongsToMany(Group::class)->withTimestamps();
    }

    public function sendPasswordResetNotification(#[\SensitiveParameter] $token): void
    {
        $this->notify(new ResetPasswordLink($token));
    }

    public function wishlistItems(): HasMany
    {
        return $this->hasMany(WishlistItem::class);
    }

    public function claimedWishlistItems(): HasMany
    {
        return $this->hasMany(WishlistItem::class, 'claimed_by_id');
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
