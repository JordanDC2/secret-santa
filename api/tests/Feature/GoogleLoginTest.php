<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\NewAccountRegistered;
use App\Notifications\ResetPasswordLink;
use App\Notifications\VerifyEmailAddress;
use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use OpenSSLAsymmetricKey;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Tokens here are signed with a key made for the test, standing in for Google's (whose public
 * half is served from a faked Google keys URL), so the real checks run end to end.
 */
class GoogleLoginTest extends TestCase
{
    use RefreshDatabase;

    private const CLIENT_ID = 'test-client.apps.googleusercontent.com';

    private OpenSSLAsymmetricKey $googleKey;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.google.client_id' => self::CLIENT_ID, 'app.admin_email' => 'owner@example.com']);
        Notification::fake();
        // Look like the React app so Sanctum starts a session, as it does for login/register.
        $this->withHeader('Origin', config('app.frontend_url'));

        $key = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
        $this->assertNotFalse($key);
        $this->googleKey = $key;
        $details = openssl_pkey_get_details($key);
        $this->assertNotFalse($details);
        $rsa = $details['rsa'];

        Http::fake(['www.googleapis.com/oauth2/v3/certs' => Http::response(['keys' => [[
            'kty' => 'RSA',
            'alg' => 'RS256',
            'use' => 'sig',
            'kid' => 'test-key',
            'n' => rtrim(strtr(base64_encode($rsa['n']), '+/', '-_'), '='),
            'e' => rtrim(strtr(base64_encode($rsa['e']), '+/', '-_'), '='),
        ]]])]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function googleToken(array $overrides = []): string
    {
        $claims = array_merge([
            'iss' => 'https://accounts.google.com',
            'aud' => self::CLIENT_ID,
            'sub' => '1234567890',
            'email' => 'Holly@Example.com',
            'email_verified' => true,
            'given_name' => 'Holly',
            'family_name' => 'Berry',
            'iat' => time(),
            'exp' => time() + 3600,
        ], $overrides);

        return JWT::encode($claims, $this->googleKey, 'RS256', 'test-key');
    }

    public function test_first_use_creates_a_confirmed_account_without_a_password_and_logs_in(): void
    {
        $this->postJson(route('auth.google'), ['credential' => $this->googleToken()])
            ->assertCreated()
            ->assertJsonPath('email', 'holly@example.com')
            ->assertJsonPath('first_name', 'Holly')
            ->assertJsonPath('last_name', 'Berry')
            ->assertJsonPath('has_password', false)
            ->assertJsonMissingPath('google_id');

        $user = User::where('email', 'holly@example.com')->sole();
        $this->assertSame('1234567890', $user->google_id);
        $this->assertNull($user->password);
        $this->assertTrue($user->hasVerifiedEmail());
        $this->assertAuthenticatedAs($user);

        // The site owner hears about it; Google already confirmed the address, so no confirm email.
        Notification::assertSentOnDemand(NewAccountRegistered::class);
        Notification::assertNotSentTo($user, VerifyEmailAddress::class);
    }

    public function test_a_google_account_with_one_name_gets_no_last_name(): void
    {
        $this->postJson(route('auth.google'), ['credential' => $this->googleToken(['family_name' => null])])
            ->assertCreated()
            ->assertJsonPath('first_name', 'Holly')
            ->assertJsonPath('last_name', null);
    }

    public function test_returning_users_log_in_by_their_google_id_even_after_changing_email(): void
    {
        $user = User::factory()->create(['email' => 'new-address@example.com']);
        $user->forceFill(['google_id' => '1234567890'])->save();

        $this->postJson(route('auth.google'), ['credential' => $this->googleToken()])
            ->assertOk()
            ->assertJsonPath('id', $user->id);

        $this->assertSame(1, User::count());
        Notification::assertNothingSent();
    }

    public function test_an_existing_confirmed_account_with_the_same_email_is_linked_and_keeps_its_password(): void
    {
        $user = User::factory()->create(['email' => 'holly@example.com']);

        $this->postJson(route('auth.google'), ['credential' => $this->googleToken()])
            ->assertOk()
            ->assertJsonPath('id', $user->id)
            ->assertJsonPath('has_password', true);

        $user->refresh();
        $this->assertSame('1234567890', $user->google_id);
        $this->assertTrue(Hash::check('password', $user->password));
        Notification::assertNothingSent();
    }

    public function test_linking_an_unconfirmed_account_drops_its_password(): void
    {
        // Someone could have signed up with Holly's address before she arrived.
        $user = User::factory()->unverified()->create(['email' => 'holly@example.com']);

        $this->postJson(route('auth.google'), ['credential' => $this->googleToken()])
            ->assertOk()
            ->assertJsonPath('has_password', false);

        $user->refresh();
        $this->assertNull($user->password);
        $this->assertTrue($user->hasVerifiedEmail());
    }

    public function test_a_kid_or_pet_can_never_sign_in_with_google(): void
    {
        $profile = User::factory()->create(['email' => 'holly@example.com', 'managed_kind' => 'child']);

        $this->postJson(route('auth.google'), ['credential' => $this->googleToken()])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('credential');

        $this->assertNull($profile->refresh()->google_id);
        $this->assertGuest();
    }

    /**
     * @return array<string, array{0: array<string, mixed>}>
     */
    public static function badTokens(): array
    {
        return [
            'for another site' => [['aud' => 'someone-else.apps.googleusercontent.com']],
            'not from Google' => [['iss' => 'https://evil.example.com']],
            'expired' => [['iat' => time() - 7200, 'exp' => time() - 3600]],
            'unconfirmed email' => [['email_verified' => false]],
        ];
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    #[DataProvider('badTokens')]
    public function test_tokens_that_fail_a_check_are_refused(array $overrides): void
    {
        $this->postJson(route('auth.google'), ['credential' => $this->googleToken($overrides)])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('credential');

        $this->assertSame(0, User::count());
        $this->assertGuest();
    }

    public function test_a_token_signed_by_anyone_but_google_is_refused(): void
    {
        $otherKey = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
        $this->assertNotFalse($otherKey);
        $forged = JWT::encode(['iss' => 'https://accounts.google.com', 'aud' => self::CLIENT_ID, 'sub' => '1', 'email' => 'a@b.com', 'email_verified' => true, 'exp' => time() + 60], $otherKey, 'RS256', 'test-key');

        $this->postJson(route('auth.google'), ['credential' => $forged])->assertUnprocessable();

        $this->assertGuest();
    }

    public function test_google_sign_in_is_off_without_a_client_id(): void
    {
        config(['services.google.client_id' => null]);

        $this->postJson(route('auth.google'), ['credential' => $this->googleToken()])->assertUnprocessable();
    }

    public function test_an_account_without_a_password_cant_log_in_with_a_blank_one(): void
    {
        $user = User::factory()->create(['password' => null]);

        $this->postJson(route('auth.login'), ['email' => $user->email, 'password' => ''])->assertUnprocessable();
        $this->postJson(route('auth.login'), ['email' => $user->email, 'password' => 'anything'])->assertUnprocessable();

        $this->assertGuest();
    }

    public function test_an_account_without_a_password_can_set_one_through_the_emailed_link(): void
    {
        $user = User::factory()->create(['password' => null]);

        $this->postJson(route('auth.password.email'), ['email' => $user->email])->assertOk();

        Notification::assertSentTo($user, ResetPasswordLink::class);
    }

    public function test_an_account_without_a_password_is_deleted_by_typing_its_email(): void
    {
        $user = User::factory()->create(['email' => 'holly@example.com', 'password' => null]);
        Sanctum::actingAs($user);

        $this->deleteJson(route('account.destroy'), ['confirm_email' => 'someone@example.com'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('confirm_email');

        $this->deleteJson(route('account.destroy'), ['confirm_email' => ' Holly@Example.com '])->assertNoContent();

        $this->assertModelMissing($user);
    }

    public function test_an_account_without_a_password_must_set_one_before_changing_email(): void
    {
        $user = User::factory()->create(['password' => null]);
        Sanctum::actingAs($user);

        $this->patchJson(route('account.profile'), [
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => 'elsewhere@example.com',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['current_password' => 'set a password first']);
    }
}
