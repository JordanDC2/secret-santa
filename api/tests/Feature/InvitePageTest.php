<?php

namespace Tests\Feature;

use App\Models\Group;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class InvitePageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // The app's real page template (unbuilt, but it has the same tags).
        config(['app.spa_index' => base_path('../web/index.html'), 'app.frontend_url' => 'https://santa.test']);
    }

    public function test_an_invite_links_preview_names_the_group_and_who_sent_it(): void
    {
        $owner = User::factory()->create(['name' => 'Holly']);
        $group = Group::factory()->create(['name' => 'North Pole Crew', 'owner_id' => $owner->id]);

        $response = $this->get('/join/'.strtolower($group->join_code))->assertOk();
        $html = $response->content();

        $this->assertStringContainsString('<title>Join North Pole Crew on Secret Santa</title>', $html);
        $this->assertMatchesRegularExpression('/property="og:title"\s+content="Join North Pole Crew on Secret Santa"/', $html);
        $this->assertMatchesRegularExpression('/property="og:description"\s+content="Holly invited you to draw names and share wishlists for North Pole Crew\."/', $html);
        $this->assertMatchesRegularExpression('/name="description"\s+content="Holly invited you/', $html);
        $this->assertMatchesRegularExpression("#property=\"og:url\"\\s+content=\"https://santa.test/join/{$group->join_code}\"#", $html);
        // The rest of the page (the app itself, the preview image) is untouched.
        $this->assertStringContainsString('<div id="app"></div>', $html);
        $this->assertStringContainsString('og-image.jpg', $html);
        // A public page: no session, so preview bots don't create one.
        $response->assertCookieMissing(config('session.cookie'));
    }

    public function test_group_names_cant_inject_html(): void
    {
        $owner = User::factory()->create(['name' => 'Eve "the elf" $1']);
        $group = Group::factory()->create(['name' => '<script>x</script> & co', 'owner_id' => $owner->id]);

        $html = $this->get("/join/{$group->join_code}")->content();

        $this->assertStringNotContainsString('<script>x</script>', $html);
        $this->assertStringContainsString('Join &lt;script&gt;x&lt;/script&gt; &amp; co on Secret Santa', $html);
        $this->assertStringContainsString('Eve &quot;the elf&quot; $1 invited you', $html);
    }

    public function test_unknown_codes_get_the_page_unchanged(): void
    {
        $this->get('/join/NOPE99')->assertOk()->assertContent(File::get(base_path('../web/index.html')));
    }
}
