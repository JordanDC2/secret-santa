<?php

namespace App\Notifications;

use App\Models\Group;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SecretSantaAssigned extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Group $group,
        public readonly User $recipient
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $frontendUrl = config('app.frontend_url');

        return (new MailMessage)
            ->subject("🎁 Your Secret Santa assignment for {$this->group->name}")
            ->greeting("Ho ho ho, {$notifiable->name}!")
            ->line("The names have been drawn for **{$this->group->name}**.")
            ->line('You are the Secret Santa for:')
            ->line("## {$this->recipient->name}")
            ->line('Keep it a secret, and happy gifting! 🎄')
            ->action('View Your Group', $frontendUrl);
    }
}
