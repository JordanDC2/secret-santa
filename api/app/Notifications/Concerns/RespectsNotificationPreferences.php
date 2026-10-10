<?php

namespace App\Notifications\Concerns;

use App\Enums\EmailKind;
use App\Models\User;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

/**
 * For notifications people can switch off: by email unless they turned this kind's email off,
 * and pushed to their devices (once they've turned push on for one) unless they turned this
 * kind's push off. For a kid or pet, each person
 * looking after them decides for themselves (see User::routeNotificationForMail/ForWebPush).
 */
trait RespectsNotificationPreferences
{
    abstract public function emailKind(): EmailKind;

    /**
     * The push version (see FestivePush): every switchable notification has one.
     */
    abstract public function toWebPush(User $notifiable): WebPushMessage;

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return $this->preferredChannels($notifiable);
    }

    /**
     * The channels this person wants for this kind (for notifications that adjust via()).
     *
     * @return array<int, string>
     */
    protected function preferredChannels(object $notifiable): array
    {
        if (! $notifiable instanceof User) {
            return ['mail'];
        }

        $channels = [];

        if ($notifiable->wantsEmail($this->emailKind())) {
            $channels[] = 'mail';
        }

        if ($notifiable->routeNotificationForWebPush($this)->isNotEmpty()) {
            $channels[] = WebPushChannel::class;
        }

        return $channels;
    }
}
