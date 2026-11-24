<?php

namespace App\Support;

use App\Enums\Action;
use App\Enums\Resource;
use App\Enums\Role;

/**
 * Matriks akses 4 peran x 6 aktivitas. Portal (menu, matriks) dan penjaga
 * rute (Gate "rbac") membaca definisi yang sama, sehingga tidak ada drift.
 */
final class Rbac
{
    public const SEMESTER = 'Ganjil 2026/2027';

    /**
     * @return array<string, array{label: string, activity: string, description: string, access: array<string, array<string, string>>}>
     */
    public static function modules(): array
    {
        return [
            Resource::Me->value => [
                'label' => 'Profil saya',
                'activity' => 'Lihat data sendiri',
                'description' => 'Identitas akun dan data akademik yang terkait dengan profil Anda.',
                'access' => [
                    'mahasiswa' => ['view' => 'Akun, registrasi, dan nilai sendiri'],
                    'dosen' => ['view' => 'Akun sendiri'],
                    'operator' => ['view' => 'Akun sendiri'],
                    'administrator' => ['view' => 'Akun sendiri'],
                ],
            ],
            Resource::Krs->value => [
                'label' => 'Kartu rencana studi',
                'activity' => 'Ajukan KRS',
                'description' => 'Pilih kelas dan kelola pengajuan studi semester ini.',
                'access' => [
                    'mahasiswa' => [
                        'view' => 'Kelas tersedia dan KRS sendiri',
                        'add' => 'KRS sendiri saat periode buka dan registrasi aktif',
                        'remove' => 'KRS sendiri tanpa nilai saat periode buka',
                    ],
                ],
            ],
            Resource::Nilai->value => [
                'label' => 'Penilaian',
                'activity' => 'Input nilai',
                'description' => 'Catat dan perbarui nilai mahasiswa di kelas yang Anda ampu.',
                'access' => [
                    'dosen' => [
                        'view' => 'Peserta dan nilai di kelas ampuan',
                        'add' => 'Nilai pertama peserta kelas ampuan',
                        'edit' => 'Nilai peserta kelas ampuan',
                    ],
                ],
            ],
            Resource::Registrasi->value => [
                'label' => 'Registrasi',
                'activity' => 'Ubah data registrasi',
                'description' => 'Kelola program studi, angkatan, dan status registrasi mahasiswa.',
                'access' => [
                    'operator' => [
                        'view' => 'Registrasi mahasiswa',
                        'edit' => 'Program studi, angkatan, dan status',
                    ],
                ],
            ],
            Resource::Akun->value => [
                'label' => 'Manajemen akun',
                'activity' => 'Kelola akun',
                'description' => 'Buat dan kelola akun pengguna untuk sistem akademik.',
                'access' => [
                    'administrator' => [
                        'view' => 'Ringkasan semua akun',
                        'add' => 'Akun nonadministrator',
                        'edit' => 'Identitas dan status akun nonadministrator',
                    ],
                ],
            ],
            Resource::Konfigurasi->value => [
                'label' => 'Konfigurasi',
                'activity' => 'Konfigurasi sistem',
                'description' => 'Atur nama institusi dan ketersediaan pengajuan KRS.',
                'access' => [
                    'administrator' => [
                        'view' => 'Konfigurasi sistem',
                        'edit' => 'Nama institusi dan periode KRS',
                    ],
                ],
            ],
        ];
    }

    public static function can(Role $role, Resource $resource, Action $action): bool
    {
        return isset(self::modules()[$resource->value]['access'][$role->value][$action->value]);
    }

    /** Deskripsi cakupan izin, atau null jika ditolak. */
    public static function scope(Role $role, Resource $resource, Action $action): ?string
    {
        return self::modules()[$resource->value]['access'][$role->value][$action->value] ?? null;
    }

    /** @return list<resource> */
    public static function resourcesFor(Role $role): array
    {
        return array_values(array_filter(
            Resource::cases(),
            fn (Resource $resource) => self::can($role, $resource, Action::View),
        ));
    }
}
