<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_login_succeeds_with_demo_password(): void
    {
        $this->post('/masuk', ['username' => 'NARA', 'password' => DatabaseSeeder::DEMO_PASSWORD])
            ->assertRedirect('/portal');
        $this->assertAuthenticatedAs(User::findOrFail(101));
    }

    public function test_wrong_password_is_rejected(): void
    {
        $this->post('/masuk', ['username' => 'nara', 'password' => 'salah'])->assertSessionHasErrors('username');
        $this->assertGuest();
    }

    public function test_inactive_account_cannot_login(): void
    {
        User::findOrFail(102)->update(['active' => false]);
        $this->post('/masuk', ['username' => 'bima', 'password' => DatabaseSeeder::DEMO_PASSWORD])
            ->assertSessionHasErrors('username');
        $this->assertGuest();
    }

    public function test_login_is_rate_limited(): void
    {
        foreach (range(1, 5) as $i) {
            $this->post('/masuk', ['username' => 'nara', 'password' => 'salah']);
        }
        $this->post('/masuk', ['username' => 'nara', 'password' => DatabaseSeeder::DEMO_PASSWORD])
            ->assertSessionHasErrors('username');
        $this->assertGuest();
    }

    public function test_logout_ends_session(): void
    {
        $this->actingAs(User::findOrFail(101))->post('/keluar')->assertRedirect('/masuk');
        $this->assertGuest();
    }

    public function test_security_headers_are_present(): void
    {
        $this->get('/masuk')->assertHeader('X-Frame-Options', 'DENY')->assertHeader('X-Content-Type-Options', 'nosniff');
    }
}
