<?php

namespace Tests\Feature;

use App\Enums\Action;
use App\Enums\Resource;
use App\Enums\Role;
use App\Models\User;
use App\Support\Rbac;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/** Menguji seluruh kombinasi peran x aktivitas x tindakan terhadap rute HTTP yang sebenarnya. */
class RbacMatrixTest extends TestCase
{
    use RefreshDatabase;

    private const ACCOUNTS = ['mahasiswa' => 101, 'dosen' => 201, 'operator' => 301, 'administrator' => 401];

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    /** @return array<string, array{string, string, string, string}> [peran, aktivitas, tindakan, metode+uri] */
    public static function combinations(): array
    {
        $routes = [
            ['me', 'view', 'GET', '/portal/profil'],
            ['krs', 'view', 'GET', '/portal/krs'],
            ['krs', 'add', 'POST', '/portal/krs/13'],
            ['krs', 'remove', 'DELETE', '/portal/krs/14'],
            ['nilai', 'view', 'GET', '/portal/nilai'],
            ['nilai', 'add', 'POST', '/portal/nilai/2'],
            ['nilai', 'edit', 'PATCH', '/portal/nilai/1'],
            ['registrasi', 'view', 'GET', '/portal/registrasi'],
            ['registrasi', 'edit', 'PATCH', '/portal/registrasi/101'],
            ['akun', 'view', 'GET', '/portal/akun'],
            ['akun', 'add', 'POST', '/portal/akun'],
            ['akun', 'edit', 'PATCH', '/portal/akun/101'],
            ['konfigurasi', 'view', 'GET', '/portal/konfigurasi'],
            ['konfigurasi', 'edit', 'PATCH', '/portal/konfigurasi'],
        ];
        $cases = [];
        foreach (Role::cases() as $role) {
            foreach ($routes as [$resource, $action, $method, $uri]) {
                $cases["{$role->value} {$resource}.{$action}"] = [$role->value, $resource, $action, "{$method} {$uri}"];
            }
        }

        return $cases;
    }

    #[DataProvider('combinations')]
    public function test_route_matches_matrix(string $role, string $resource, string $action, string $endpoint): void
    {
        [$method, $uri] = explode(' ', $endpoint);
        $allowed = Rbac::can(Role::from($role), Resource::from($resource), Action::from($action));

        $response = $this->actingAs(User::findOrFail(self::ACCOUNTS[$role]))->call($method, $uri);

        if ($allowed) {
            $this->assertNotSame(403, $response->getStatusCode(), "{$role} seharusnya boleh {$resource}.{$action}");
        } else {
            $response->assertForbidden();
        }
    }

    public function test_all_96_matrix_cells_are_enumerated(): void
    {
        $count = 0;
        foreach (Role::cases() as $role) {
            foreach (Resource::cases() as $resource) {
                foreach (Action::cases() as $action) {
                    Rbac::can($role, $resource, $action);
                    $count++;
                }
            }
        }
        $this->assertSame(96, $count);
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/portal/krs')->assertRedirect('/masuk');
        $this->post('/portal/krs/11')->assertRedirect('/masuk');
    }
}
