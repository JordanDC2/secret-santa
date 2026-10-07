<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\LinkPreview\HostResolver;
use App\Support\LinkPreview\SafeUrl;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LinkPreviewTest extends TestCase
{
    use RefreshDatabase;

    /** @var array<string, array<int, string>> Fake DNS: host => addresses. */
    private array $dns = [
        'shop.example' => ['93.184.216.34'],
        'cdn.shop.example' => ['93.184.216.35'],
        'localhost' => ['127.0.0.1'],
        'sneaky.example' => ['93.184.216.36', '10.0.0.7'],
        'metadata.example' => ['169.254.169.254'],
        'www.amazon.com' => ['93.184.216.37'],
        'www.walmart.com' => ['93.184.216.38'],
    ];

    protected function setUp(): void
    {
        parent::setUp();

        $dns = $this->dns;
        $this->app->instance(HostResolver::class, new class($dns) extends HostResolver
        {
            /** @param array<string, array<int, string>> $dns */
            public function __construct(private array $dns) {}

            public function resolve(string $host): array
            {
                return filter_var($host, FILTER_VALIDATE_IP) ? [$host] : ($this->dns[$host] ?? []);
            }
        });
        Http::preventStrayRequests();
    }

    public function test_only_public_http_addresses_on_standard_ports_are_allowed(): void
    {
        $resolver = $this->app->make(HostResolver::class);
        $blocked = [
            'http://127.0.0.1/', 'http://localhost/', 'http://169.254.169.254/latest/meta-data/',
            'http://10.0.0.5/', 'http://192.168.1.1/', 'http://100.64.0.1/', 'http://[::1]/',
            'http://[::ffff:127.0.0.1]/', 'http://sneaky.example/', 'http://metadata.example/',
            'ftp://shop.example/', 'http://shop.example:8080/', 'http://user:pass@shop.example/',
            'http://unknown.example/', 'not a url',
        ];

        foreach ($blocked as $url) {
            $this->assertNull(SafeUrl::check($url, $resolver), "{$url} should be refused");
        }

        $this->assertSame('93.184.216.34', SafeUrl::check('https://shop.example/socks', $resolver)->ip);
    }

    public function test_reads_open_graph_tags(): void
    {
        Http::fake(['shop.example/*' => Http::response($this->page(<<<'HTML'
            <meta property="og:title" content="Cozy Wool Socks &amp; More">
            <meta property="og:image" content="/img/socks.jpg">
            <meta property="product:price:amount" content="18.50">
        HTML), 200, ['Content-Type' => 'text/html; charset=utf-8'])]);

        $this->previewAs('https://shop.example/socks')
            ->assertOk()
            ->assertExactJson([
                'name' => 'Cozy Wool Socks & More',
                'price' => 18.5,
                'image_url' => 'https://shop.example/img/socks.jpg',
            ]);
    }

    public function test_prefers_schema_org_product_data(): void
    {
        Http::fake(['shop.example/*' => Http::response($this->page(<<<'HTML'
            <title>Shop - Kindle</title>
            <meta property="og:title" content="Generic page title">
            <script type="application/ld+json">
                {"@context":"https://schema.org","@graph":[{"@type":"WebPage"},
                 {"@type":"Product","name":"Kindle Paperwhite","image":["https://cdn.shop.example/kindle.png"],
                  "offers":{"@type":"Offer","price":"159.99","priceCurrency":"USD"}}]}
            </script>
        HTML), 200, ['Content-Type' => 'text/html'])]);

        $this->previewAs('https://shop.example/kindle')->assertExactJson([
            'name' => 'Kindle Paperwhite',
            'price' => 159.99,
            'image_url' => 'https://cdn.shop.example/kindle.png',
        ]);
    }

    public function test_reads_amazon_product_pages(): void
    {
        // Amazon has no Open Graph or schema.org data, only its own markup.
        Http::fake(['www.amazon.com/*' => Http::response(<<<'HTML'
            <!doctype html><html><head><meta name="title" content="Amazon.com: Socks : Clothing"></head><body>
            <span id="productTitle" class="a-size-medium">   adidas Men&#39;s Athletic
                Crew Socks   </span>
            <span class="a-price priceToPay apex-pricetopay-value"><span class="a-offscreen"> </span>
                <span aria-hidden="true"><span class="a-price-symbol">$</span><span class="a-price-whole">18<span class="a-price-decimal">.</span></span><span class="a-price-fraction">19</span></span></span>
            <img id="landingImage" src="https://m.media-amazon.com/images/I/socks._SX342_.jpg"
                data-old-hires="https://m.media-amazon.com/images/I/socks._SL1500_.jpg">
            </body></html>
        HTML, 200, ['Content-Type' => 'text/html;charset=UTF-8'])]);

        $this->previewAs('https://www.amazon.com/adidas-Socks/dp/B008YA0Z44?th=1&psc=1')->assertExactJson([
            'name' => "adidas Men's Athletic Crew Socks",
            'price' => 18.19,
            'image_url' => 'https://m.media-amazon.com/images/I/socks._SL1500_.jpg',
        ]);

        Http::assertSent(fn (Request $request) => $request->hasHeader('Accept-Encoding', 'gzip, deflate'));
    }

    public function test_reads_walmart_product_data(): void
    {
        // Walmart's og:title has a " - Walmart.com" suffix and there's no price tag; the
        // product data lives in the page's Next.js JSON.
        $data = json_encode(['props' => ['pageProps' => ['initialData' => ['data' => ['product' => [
            'name' => 'Great Value Purified Drinking Water, 40 Count',
            'priceInfo' => ['currentPrice' => ['price' => 5.97, 'currencyUnit' => 'USD']],
            'imageInfo' => ['thumbnailUrl' => 'https://i5.walmartimages.com/seo/water.jpeg'],
        ]]]]]]);
        Http::fake(['www.walmart.com/*' => Http::response($this->page(
            '<meta property="og:title" content="Great Value Purified Drinking Water - Walmart.com">'
            .'<script id="__NEXT_DATA__" type="application/json">'.$data.'</script>'
        ), 200, ['Content-Type' => 'text/html'])]);

        $this->previewAs('https://www.walmart.com/ip/Great-Value-Water/992524020?classType=VARIANT')->assertExactJson([
            'name' => 'Great Value Purified Drinking Water, 40 Count',
            'price' => 5.97,
            'image_url' => 'https://i5.walmartimages.com/seo/water.jpeg',
        ]);
    }

    public function test_a_plain_page_title_is_not_used_as_the_item_name(): void
    {
        // Bot-check and loading pages have a <title> but no product metadata.
        Http::fake(['shop.example/*' => Http::response($this->page('<title>Hang Tight! Routing to checkout..</title>'), 200, ['Content-Type' => 'text/html'])]);

        $this->previewAs('https://shop.example/jacket')->assertJsonPath('name', null);
    }

    public function test_unrendered_template_tags_and_invalid_image_urls_are_dropped(): void
    {
        // Some shops fill their meta tags in with JavaScript, so we see the raw placeholders.
        Http::fake(['shop.example/barrel' => Http::response($this->page(
            '<meta property="og:title" content="{{::og.title}}"><meta property="og:image" content="{{::og.image}}">'
        ), 200, ['Content-Type' => 'text/html'])]);

        $this->previewAs('https://shop.example/barrel')->assertExactJson(['name' => null, 'price' => null, 'image_url' => null]);

        Http::fake(['shop.example/spaced' => Http::response($this->page(
            '<meta property="og:title" content="Barrel"><meta property="og:image" content="https://cdn.shop.example/a barrel.jpg">'
        ), 200, ['Content-Type' => 'text/html'])]);

        $this->previewAs('https://shop.example/spaced')->assertJsonPath('name', 'Barrel')->assertJsonPath('image_url', null);
    }

    public function test_a_redirect_to_a_private_address_is_not_followed(): void
    {
        Http::fake([
            'shop.example/*' => Http::response('', 302, ['Location' => 'http://169.254.169.254/latest/meta-data/']),
        ]);

        $this->previewAs('https://shop.example/trick')->assertExactJson(['name' => null, 'price' => null, 'image_url' => null]);

        Http::assertNotSent(fn (Request $request) => str_contains($request->url(), '169.254.169.254'));
    }

    public function test_pages_it_cannot_use_just_return_nothing(): void
    {
        Http::fake(['shop.example/*' => Http::response('{"not":"html"}', 200, ['Content-Type' => 'application/json'])]);

        $this->previewAs('https://shop.example/api')->assertExactJson(['name' => null, 'price' => null, 'image_url' => null]);
        $this->previewAs('http://localhost/admin')->assertExactJson(['name' => null, 'price' => null, 'image_url' => null]);
    }

    public function test_preview_needs_a_signed_in_user_and_a_web_link(): void
    {
        $this->postJson(route('wishlist.link-preview'), ['url' => 'https://shop.example/'])->assertUnauthorized();

        Sanctum::actingAs(User::factory()->create());
        $this->postJson(route('wishlist.link-preview'), ['url' => 'javascript:alert(1)'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('url');
    }

    public function test_items_store_only_web_image_links(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson(route('wishlist.items.store'), [
            'name' => 'Socks', 'rating' => 3, 'image_url' => 'https://cdn.shop.example/socks.jpg',
        ])->assertCreated()->assertJsonPath('image_url', 'https://cdn.shop.example/socks.jpg');

        $this->postJson(route('wishlist.items.store'), [
            'name' => 'Socks', 'rating' => 3, 'image_url' => 'javascript:alert(1)',
        ])->assertUnprocessable()->assertJsonValidationErrors('image_url');
    }

    /**
     * @return TestResponse<JsonResponse>
     */
    private function previewAs(string $url): TestResponse
    {
        Sanctum::actingAs(User::factory()->create());

        return $this->postJson(route('wishlist.link-preview'), ['url' => $url]);
    }

    private function page(string $head): string
    {
        return "<!doctype html><html><head>{$head}</head><body>Hi</body></html>";
    }
}
