<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

/**
 * Every email is written by Santa's elf. His name comes from MAIL_FROM_NAME, so the
 * sign-off always matches the sender shown in the inbox.
 */
class ElfMailMessage extends MailMessage
{
    public function __construct()
    {
        // Two trailing spaces are a Markdown line break.
        $this->salutation("Merry gifting,  \n".self::signature());
    }

    public static function signature(): string
    {
        return config('mail.from.name');
    }
}
