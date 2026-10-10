<?php

namespace App\Notifications;

use NotificationChannels\WebPush\WebPushMessage;

/**
 * The push version of a notification: a title, one line, and the page a tap opens (the service
 * worker, web/public/sw.js, opens it). Pushes show on lock screens, where family can see them,
 * so they never name who someone is buying for; the email and the app do that.
 */
class FestivePush
{
    /**
     * @param  string  $path  A page in the React app, e.g. "/wishlists/5".
     * @param  string|null  $tag  Pushes with the same tag replace each other (one per chat, say).
     */
    public static function make(string $title, string $body, string $path, ?string $tag = null): WebPushMessage
    {
        $message = (new WebPushMessage)
            ->title($title)
            ->body($body)
            ->icon('/icon-192.png')
            // Android's status-bar icon: a white Santa hat silhouette (web/public/badge.svg),
            // instead of the browser's generic bell.
            ->badge('/badge-96.png')
            ->data(['url' => $path]);

        return $tag === null ? $message : $message->tag($tag)->renotify();
    }
}
