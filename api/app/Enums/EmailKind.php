<?php

namespace App\Enums;

/**
 * The kinds of notification people can turn off on their Settings page, by email and by push
 * separately. Password resets, email confirmation and the organizer's new-account email aren't
 * here: those are email only, and always go.
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
