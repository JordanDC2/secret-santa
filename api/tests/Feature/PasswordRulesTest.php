<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use Illuminate\Testing\TestResponse;
use Illuminate\Validation\Rules\Password;
use Tests\TestCase;

class PasswordRulesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Sign-ups come from the React app, which Sanctum recognises by its Origin.
        $this->withHeader('Origin', config('app.frontend_url'));
    }

    public function test_passwords_are_8_to_72_characters(): void
    {
        $this->register(str_repeat('a', 7))->assertJsonValidationErrors('password');
        // bcrypt ignores everything past 72 bytes, so longer ones are refused rather than cut short.
        $this->register(str_repeat('a', 73))->assertJsonValidationErrors('password');
        $this->register(str_repeat('a', 72))->assertCreated();
    }

    public function test_production_refuses_passwords_from_data_breaches(): void
    {
        // Production turns on CSRF checks too, so this checks the rule itself, not a whole sign-up.
        $this->app->detectEnvironment(fn () => 'production');
        $leaked = 'correct horse battery staple';
        $hash = strtoupper(sha1($leaked));
        // Have I Been Pwned's range API: only the hash's first 5 characters are sent.
        Http::fake(['api.pwnedpasswords.com/range/'.substr($hash, 0, 5) => Http::response(substr($hash, 5).":4242\r\n0123456789ABCDEF0123456789ABCDEF012:1")]);

        $errors = Validator::make(['password' => $leaked], ['password' => [Password::defaults()]])->errors();

        $this->assertStringContainsString('shown up in a data breach', (string) $errors->first('password'));
        Http::assertSent(fn ($request) => $request->url() === 'https://api.pwnedpasswords.com/range/'.substr($hash, 0, 5));
        Http::assertNotSent(fn ($request) => str_contains($request->url(), substr($hash, 5)) || str_contains((string) $request->body(), $leaked));
    }

    public function test_production_lets_passwords_through_if_the_breach_check_is_down(): void
    {
        $this->app->detectEnvironment(fn () => 'production');
        Http::fake(['api.pwnedpasswords.com/*' => Http::response('', 503)]);

        $this->assertTrue(Validator::make(['password' => 'a long unusual passphrase'], ['password' => [Password::defaults()]])->passes());
    }

    public function test_development_and_tests_never_call_the_breach_check(): void
    {
        Http::preventStrayRequests();

        $this->register('correct horse battery staple')->assertCreated();
    }

    /**
     * @return TestResponse<JsonResponse>
     */
    private function register(string $password): TestResponse
    {
        return $this->postJson(route('auth.register'), [
            'first_name' => 'Holly',
            'last_name' => 'Berry',
            'email' => 'holly'.strlen($password).'@example.com',
            'password' => $password,
            'password_confirmation' => $password,
        ]);
    }
}
