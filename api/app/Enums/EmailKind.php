<?php

namespace App\Enums;

/**
 * The kinds of email people can turn off on their Settings page. Password resets and the
 * organizer's new-account email aren't here: those always go.
 */
enum EmailKind: string
{
    case Assignments = 'assignments';
    case SantaChat = 'santa_chat';
    case Reminders = 'reminders';
    case Nudges = 'nudges';
    case GiftIdeas = 'gift_ideas';
    case NewMembers = 'new_members';
    case ExchangeUpdates = 'exchange_updates';

    /**
     * How the switch and the emails' footers name it.
     */
    public function label(): string
    {
        return match ($this) {
            self::Assignments => 'Secret Santa assignment',
            self::SantaChat => 'Santa chat',
            self::Reminders => 'exchange reminder',
            self::Nudges => 'nudge',
            self::GiftIdeas => 'gift idea',
            self::NewMembers => 'new group member',
            self::ExchangeUpdates => 'exchange date and budget',
        };
    }
}
