<?php

namespace App\Http\Controllers\Group;

use App\Http\Controllers\Controller;
use App\Models\Group;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

/**
 * Serves the React app's page for an invite link (/join/CODE) with link-preview tags naming
 * the group, so a shared invite shows "Join North Pole Test Crew on Secret Santa" in chat
 * apps instead of the general preview. The page is otherwise the same file the web server
 * sends for every other route; unknown codes get it unchanged. The preview image stays the
 * general one: drawing one per group isn't worth the server's time.
 */
class InvitePageHandler extends Controller
{
    public function __invoke(string $code): Response
    {
        $html = file_get_contents(config('app.spa_index'));
        abort_if($html === false, 500, 'The web app has not been built.');

        $group = Group::where('join_code', Str::upper($code))->with('owner')->first();

        if ($group !== null) {
            $title = "Join {$group->name} on Secret Santa";
            $description = "{$group->owner->name} invited you to draw names and share wishlists for {$group->name}.";
            $html = $this->withTag($html, '<title>', '</title>', e($title));
            $html = $this->withMeta($html, 'property="og:title"', $title);
            $html = $this->withMeta($html, 'property="og:description"', $description);
            $html = $this->withMeta($html, 'name="description"', $description);
            $html = $this->withMeta($html, 'property="og:url"', config('app.frontend_url')."/join/{$group->join_code}");
        }

        return response($html)->header('Content-Type', 'text/html; charset=UTF-8')->header('Cache-Control', 'no-cache');
    }

    /**
     * Replaces the content="…" of the meta tag with the given attribute (the formatter may
     * have wrapped the tag over several lines).
     */
    private function withMeta(string $html, string $attribute, string $content): string
    {
        $pattern = '/(<meta\s+'.preg_quote($attribute, '/').'\s+content=")[^"]*(")/';

        return preg_replace($pattern, '${1}'.addcslashes(e($content), '\\$').'${2}', $html, 1) ?? $html;
    }

    private function withTag(string $html, string $open, string $close, string $content): string
    {
        $pattern = '/'.preg_quote($open, '/').'.*?'.preg_quote($close, '/').'/s';

        return preg_replace($pattern, $open.addcslashes($content, '\\$').$close, $html, 1) ?? $html;
    }
}
