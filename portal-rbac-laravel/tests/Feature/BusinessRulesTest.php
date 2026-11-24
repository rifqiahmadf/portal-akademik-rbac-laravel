<?php

namespace Tests\Feature;

use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\Registration;
use App\Models\Setting;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class BusinessRulesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    private function as(int $id): static
    {
        return $this->actingAs(User::findOrFail($id));
    }

    public function test_student_can_submit_and_withdraw_krs(): void
    {
        $this->as(101)->post('/portal/krs/12')->assertSessionHas('status');
        $this->assertDatabaseHas('enrollments', ['student_id' => 101, 'course_id' => 12]);
        $this->as(101)->delete('/portal/krs/12')->assertSessionHas('status');
        $this->assertDatabaseMissing('enrollments', ['student_id' => 101, 'course_id' => 12]);
    }

    public function test_duplicate_krs_is_rejected(): void
    {
        $this->as(101)->post('/portal/krs/11')->assertSessionHas('error');
        $this->assertSame(1, Enrollment::where(['student_id' => 101, 'course_id' => 11])->count());
    }

    public function test_krs_closed_period_blocks_changes(): void
    {
        Setting::current()->update(['krs_open' => false]);
        $this->as(101)->post('/portal/krs/12')->assertSessionHas('error');
        $this->as(101)->delete('/portal/krs/11')->assertSessionHas('error');
        $this->assertDatabaseHas('enrollments', ['student_id' => 101, 'course_id' => 11]);
    }

    public function test_inactive_registration_blocks_krs(): void
    {
        Registration::findOrFail(101)->update(['status' => 'Cuti']);
        $this->as(101)->post('/portal/krs/12')->assertSessionHas('error');
    }

    public function test_graded_enrollment_cannot_be_withdrawn(): void
    {
        $this->as(101)->delete('/portal/krs/11')->assertSessionHas('error');
        $this->assertDatabaseHas('enrollments', ['student_id' => 101, 'course_id' => 11]);
    }

    public function test_lecturer_grades_own_class_only(): void
    {
        $this->as(201)->post('/portal/nilai/2', ['score' => 75])->assertSessionHas('status');
        $this->assertSame(75, Grade::findOrFail(2)->score);
        $this->as(201)->patch('/portal/nilai/2', ['score' => 80]);
        $this->assertSame(80, Grade::findOrFail(2)->score);
        // Enrollment 3 = kelas milik dosen 202.
        $this->as(201)->post('/portal/nilai/3', ['score' => 90])->assertForbidden();
        $this->assertDatabaseMissing('grades', ['enrollment_id' => 3]);
    }

    public function test_grade_validation_and_add_edit_semantics(): void
    {
        $this->as(201)->post('/portal/nilai/2', ['score' => 101])->assertSessionHasErrors('score');
        $this->as(201)->post('/portal/nilai/1', ['score' => 50])->assertSessionHas('error');
        $this->as(201)->patch('/portal/nilai/2', ['score' => 50])->assertSessionHas('error');
        $this->assertSame(88, Grade::findOrFail(1)->score);
    }

    public function test_operator_updates_registration_with_validation(): void
    {
        $this->as(301)->patch('/portal/registrasi/101', ['program' => 'Teknik Komputer', 'cohort' => 2024, 'status' => 'Cuti'])
            ->assertSessionHas('status');
        $this->assertDatabaseHas('registrations', ['student_id' => 101, 'program' => 'Teknik Komputer', 'status' => 'Cuti']);
        $this->as(301)->patch('/portal/registrasi/101', ['program' => 'Hukum', 'cohort' => 1999, 'status' => 'X'])
            ->assertSessionHasErrors(['program', 'cohort', 'status']);
    }

    public function test_admin_creates_student_with_inactive_registration(): void
    {
        $this->as(401)->post('/portal/akun', [
            'username' => 'Rani', 'name' => 'Rani Putri', 'email' => 'rani@akademik.example',
            'role' => 'mahasiswa', 'password' => 'kata-sandi-panjang',
        ])->assertSessionHas('status');
        $user = User::where('username', 'rani')->firstOrFail();
        $this->assertSame('Nonaktif', $user->registration->status);
        $this->assertNotSame('kata-sandi-panjang', $user->password);
    }

    public function test_admin_cannot_create_administrator_or_short_password(): void
    {
        $base = ['username' => 'baru', 'name' => 'Baru Nama', 'email' => 'baru@akademik.example'];
        $this->as(401)->post('/portal/akun', $base + ['role' => 'administrator', 'password' => 'kata-sandi-panjang'])->assertSessionHasErrors('role');
        $this->as(401)->post('/portal/akun', $base + ['role' => 'dosen', 'password' => 'pendek'])->assertSessionHasErrors('password');
        $this->assertDatabaseMissing('users', ['username' => 'baru']);
    }

    public function test_deactivating_account_revokes_sessions_and_protects_admin(): void
    {
        DB::table('sessions')->insert(['id' => 's1', 'user_id' => 102, 'payload' => '', 'last_activity' => time()]);
        $this->as(401)->patch('/portal/akun/102', ['name' => 'Bima Arunika', 'email' => 'bima@akademik.example', 'active' => '0'])
            ->assertSessionHas('status');
        $this->assertDatabaseMissing('sessions', ['user_id' => 102]);
        $this->assertFalse(User::findOrFail(102)->active);

        $this->as(401)->patch('/portal/akun/401', ['name' => 'X Y', 'email' => 'x@akademik.example', 'active' => '0'])
            ->assertSessionHas('error');
        $this->assertTrue(User::findOrFail(401)->active);
    }

    public function test_admin_updates_configuration(): void
    {
        $this->as(401)->patch('/portal/konfigurasi', ['institution' => 'Institut Baru'])->assertSessionHas('status');
        $setting = Setting::current();
        $this->assertSame('Institut Baru', $setting->institution);
        $this->assertFalse($setting->krs_open);
    }

    public function test_portal_pages_render_for_each_role(): void
    {
        foreach ([101 => '/portal/krs', 201 => '/portal/nilai', 301 => '/portal/registrasi', 401 => '/portal/akun'] as $id => $uri) {
            $this->as($id)->get($uri)->assertOk();
            $this->as($id)->get('/portal')->assertOk();
            $this->as($id)->get('/portal/matriks')->assertOk();
            $this->as($id)->get('/portal/profil')->assertOk();
        }
    }
}
