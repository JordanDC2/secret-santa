<?php

namespace App\Notifications;

use App\Models\User;

/**
 * Who an email is about, in words: the reader themselves ("you", "your"), or for a kid or pet,
 * the kid by name ("Lily", "Lily's"), since it's their parents reading it. Names come out
 * Markdown-escaped, ready to drop into a line.
 */
final class Addressee
{
    public function __construct(private readonly User $user) {}

    public function isManaged(): bool
    {
        return $this->user->isManagedProfile();
    }

    public function name(): string
    {
        return ElfMailMessage::plain($this->user->first_name);
    }

    /** "Hi Holly!", or for a kid "Hi! Here's an update about Lily." */
    public function greeting(): string
    {
        return $this->isManaged() ? "Hi! Here's an update about {$this->name()}." : "Hi {$this->name()}!";
    }

    /** "you" or "Lily"; "You" to start a sentence. */
    public function you(bool $startOfSentence = false): string
    {
        return $this->isManaged() ? $this->name() : ($startOfSentence ? 'You' : 'you');
    }

    /** "your" or "Lily's"; "Your" to start a sentence. */
    public function your(bool $startOfSentence = false): string
    {
        return $this->isManaged() ? "{$this->name()}'s" : ($startOfSentence ? 'Your' : 'your');
    }

    /** "you're" or "Lily is" */
    public function youAre(): string
    {
        return $this->isManaged() ? "{$this->name()} is" : "you're";
    }
}
