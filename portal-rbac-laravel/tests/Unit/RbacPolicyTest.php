<?php

namespace Tests\Unit;

use App\Enums\Action;
use App\Enums\Resource;
use App\Enums\Role;
use App\Support\Rbac;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/** Tabel acuan ("golden") matriks akses. Perubahan kebijakan harus mengubah tabel ini secara sadar. */
class RbacPolicyTest extends TestCase
{
    /** @var array<string, array<string, string>> peran => aktivitas => huruf tindakan (v=lihat, a=tambah, e=ubah, r=hapus) */
    private const EXPECTED = [
        'mahasiswa' => ['me' => 'v', 'krs' => 'var', 'nilai' => '', 'registrasi' => '', 'akun' => '', 'konfigurasi' => ''],
        'dosen' => ['me' => 'v', 'krs' => '', 'nilai' => 'vae', 'registrasi' => '', 'akun' => '', 'konfigurasi' => ''],
        'operator' => ['me' => 'v', 'krs' => '', 'nilai' => '', 'registrasi' => 've', 'akun' => '', 'konfigurasi' => ''],
        'administrator' => ['me' => 'v', 'krs' => '', 'nilai' => '', 'registrasi' => '', 'akun' => 'vae', 'konfigurasi' => 've'],
    ];

    private const LETTER = ['v' => Action::View, 'a' => Action::Add, 'e' => Action::Edit, 'r' => Action::Remove];

    /** @return array<string, array{string, string, string}> */
    public static function cells(): array
    {
        $cases = [];
        foreach (Role::cases() as $role) {
            foreach (Resource::cases() as $resource) {
                foreach (Action::cases() as $action) {
                    $cases["{$role->value}/{$resource->value}/{$action->value}"] = [$role->value, $resource->value, $action->value];
                }
            }
        }

        return $cases;
    }

    #[DataProvider('cells')]
    public function test_cell_matches_expected_table(string $role, string $resource, string $action): void
    {
        $letters = self::EXPECTED[$role][$resource];
        $expected = collect(str_split($letters))->contains(fn (string $l) => self::LETTER[$l]->value === $action);

        $this->assertSame(
            $expected,
            Rbac::can(Role::from($role), Resource::from($resource), Action::from($action)),
        );
    }

    public function test_there_are_96_cells(): void
    {
        $this->assertCount(96, self::cells());
    }

    public function test_least_privilege_invariants(): void
    {
        foreach (Role::cases() as $role) {
            foreach (Resource::cases() as $resource) {
                $this->assertFalse(Rbac::can($role, $resource, Action::Remove) && ! ($role === Role::Mahasiswa && $resource === Resource::Krs),
                    'Hanya penarikan KRS oleh mahasiswa yang boleh berupa tindakan hapus.');
            }
        }
    }
}
