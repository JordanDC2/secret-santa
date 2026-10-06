<?php

namespace App\Notifications;

use App\Enums\EmailKind;
use App\Models\User;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\HtmlString;

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
    public function settingsFooter(EmailKind $kind, ?Addressee $about = null): static
    {
        $settings = config('app.frontend_url').'/settings';
        $because = $about?->isManaged() ? "you look after {$about->name()} and {$kind->label()} emails are on" : "{$kind->label()} emails are on";

        return $this->line("You're getting this because {$because}. [Change your email settings]({$settings}).");
    }

    /**
     * Who someone drew, styled like the app's reveal: a soft mint box with a quiet label and
     * the name in festive red after a present. The name is in full, so there's no doubt who
     * to shop for. Spans rather than divs, since line() wraps this in a paragraph.
     */
    public static function recipientBox(Addressee $who, User $recipient): HtmlString
    {
        // A kid's name can be in the label ("Lily is"); quotes are fine in text, so only <, > and & are escaped.
        $label = htmlspecialchars(self::plain(ucfirst($who->youAre()).' the Secret Santa for'), ENT_NOQUOTES);
        $name = e(self::plain($recipient->full_name));

        return new HtmlString(
            '<span style="display: block; background-color: #eef6f0; border-radius: 8px; padding: 14px 16px; margin: 4px 0 4px;">'
            .'<span style="display: block; color: #5f6870; font-size: 14px;">'.$label.'</span>'
            .'<span style="display: block; color: #c00026; font-family: \'Mountains of Christmas\', Georgia, \'Times New Roman\', serif; font-size: 30px; font-weight: bold; line-height: 1.2;">🎁 '.$name.'</span>'
            .'</span>',
        );
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
