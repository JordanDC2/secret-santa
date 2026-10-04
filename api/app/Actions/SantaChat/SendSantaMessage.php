<?php

namespace App\Actions\SantaChat;

use App\Events\SantaChatChanged;
use App\Models\SantaMessage;
use App\Models\SecretSantaAssignment;
use App\Notifications\SantaMessageReceived;

class SendSantaMessage
{
    /**
     * Adds a message to a Santa ↔ person thread. The other side gets an email only when
     * this is their first unread message from this side; more wait for them in the app.
     */
    public function __invoke(SecretSantaAssignment $assignment, bool $fromSanta, string $body): SantaMessage
    {
        $alreadyUnread = $assignment->unreadCountFor(viewerIsSanta: ! $fromSanta) > 0;

        $message = $assignment->messages()->create(['from_santa' => $fromSanta, 'body' => $body]);

        $group = $assignment->group;
        $reader = $fromSanta ? $assignment->receiver : $assignment->giver;

        if (! $alreadyUnread) {
            $reader->notify(new SantaMessageReceived(
                groupId: $group->id,
                groupName: $group->name,
                fromSanta: $fromSanta,
                personName: $assignment->receiver->name,
            ));
        }

        // Both sides: the reader for their unread badge, the writer for their other tabs.
        SantaChatChanged::dispatch($assignment->giver_id, $group->id);
        SantaChatChanged::dispatch($assignment->receiver_id, $group->id);

        return $message;
    }
}
