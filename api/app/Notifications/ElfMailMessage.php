<?php

namespace App\Notifications;

use App\Enums\EmailKind;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * The app's emails (festive theme in resources/views/vendor/mail). They come from the app
 * (MAIL_FROM_NAME, "Secret Santa"), and Santa's elf signs them off.
 */
class ElfMailMessage extends MailMessage
{
    public function __construct()
    {
        // Two trailing spaces are a Markdown line break.
        $this->salutation("Merry gifting,  \n".self::signature());
    }

    /**
     * The last line of an email people can turn off: why they got it, and where to stop it.
     */
    public function settingsFooter(EmailKind $kind): static
    {
        $settings = config('app.frontend_url').'/account';

        return $this->line("You're getting this because {$kind->label()} emails are on. [Change your email settings]({$settings}).");
    }

    public static function signature(): string
    {
        return "Pip Snowberry, Santa's Elf";
    }

    /**
     * Escape text someone typed (names, group names) before it goes into the email body,
     * which is parsed as Markdown: otherwise "[Free gift](https://...)" in a name would
     * become a real link in an email sent from our trusted address. HTML is escaped later
     * by the mail template, so this only neutralizes Markdown syntax.
     */
    public static function plain(string $text): string
    {
        return preg_replace('/([\\\\`*_{}\[\]()#+\-.!|>~<])/', '\\\\$1', $text);
    }
}
