<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\Registration;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/** Data demo fiktif. Aman dijalankan ulang (idempoten). */
class DatabaseSeeder extends Seeder
{
    public const DEMO_PASSWORD = 'AkademikDemo!26';

    public function run(): void
    {
        $accounts = [
            [101, 'nara', 'Nara Pradipta', 'mahasiswa'],
            [102, 'bima', 'Bima Arunika', 'mahasiswa'],
            [201, 'ratih', 'Ratih Adinata', 'dosen'],
            [202, 'yudha', 'Yudha Wiratama', 'dosen'],
            [301, 'sinta', 'Sinta Maheswari', 'operator'],
            [401, 'arya', 'Arya Pamungkas', 'administrator'],
        ];
        foreach ($accounts as [$id, $username, $name, $role]) {
            $user = User::query()->firstOrNew(['id' => $id]);
            $user->forceFill([
                'username' => $username,
                'name' => $name,
                'email' => "{$username}@akademik.example",
                'role' => $role,
                'active' => true,
            ]);
            if (! $user->exists) {
                $user->password = self::DEMO_PASSWORD;
            }
            $user->save();
        }

        Registration::query()->upsert([
            ['student_id' => 101, 'program' => 'Informatika', 'cohort' => 2025, 'status' => 'Aktif'],
            ['student_id' => 102, 'program' => 'Sistem Informasi', 'cohort' => 2025, 'status' => 'Aktif'],
        ], ['student_id'], ['program', 'cohort', 'status']);

        Course::query()->upsert([
            ['id' => 11, 'code' => 'IF201', 'name' => 'Basis Data', 'credits' => 3, 'schedule' => 'Senin · 08.00', 'lecturer_id' => 201],
            ['id' => 12, 'code' => 'IF204', 'name' => 'Pemrograman Web', 'credits' => 3, 'schedule' => 'Rabu · 10.00', 'lecturer_id' => 202],
            ['id' => 13, 'code' => 'IF207', 'name' => 'Keamanan Informasi', 'credits' => 3, 'schedule' => 'Kamis · 13.00', 'lecturer_id' => 201],
            ['id' => 14, 'code' => 'IF212', 'name' => 'Interaksi Manusia dan Komputer', 'credits' => 2, 'schedule' => 'Jumat · 09.00', 'lecturer_id' => 202],
        ], ['id'], ['code', 'name', 'credits', 'schedule', 'lecturer_id']);

        Enrollment::query()->upsert([
            ['id' => 1, 'student_id' => 101, 'course_id' => 11],
            ['id' => 2, 'student_id' => 102, 'course_id' => 11],
            ['id' => 3, 'student_id' => 102, 'course_id' => 12],
        ], ['id'], ['student_id', 'course_id']);
        Grade::query()->firstOrCreate(['enrollment_id' => 1], ['score' => 88]);

        Setting::query()->firstOrCreate(['id' => 1], ['institution' => 'Institut Cakrawala', 'krs_open' => true]);

        if (DB::getDriverName() === 'pgsql') {
            foreach (['users', 'enrollments'] as $table) {
                DB::statement("SELECT setval(pg_get_serial_sequence('{$table}', 'id'), GREATEST((SELECT MAX(id) FROM {$table}), 1))");
            }
        }
    }
}
