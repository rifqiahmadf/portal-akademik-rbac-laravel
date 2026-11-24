<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class KrsService
{
    public function submit(User $student, Course $course): void
    {
        DB::transaction(function () use ($student, $course) {
            $this->assertOpen();
            if ($student->registration?->status !== 'Aktif') {
                throw new BusinessRuleException('Registrasi harus aktif untuk mengajukan KRS.');
            }
            if (Enrollment::query()->where(['student_id' => $student->id, 'course_id' => $course->id])->exists()) {
                throw new BusinessRuleException('Kelas sudah ada dalam KRS Anda.');
            }
            Enrollment::query()->create(['student_id' => $student->id, 'course_id' => $course->id]);
        });
    }

    public function withdraw(User $student, Course $course): void
    {
        DB::transaction(function () use ($student, $course) {
            $this->assertOpen();
            $enrollment = Enrollment::query()
                ->with('grade')
                ->where(['student_id' => $student->id, 'course_id' => $course->id])
                ->first();
            if (! $enrollment) {
                throw new BusinessRuleException('Kelas tersebut tidak ada dalam KRS Anda.');
            }
            if ($enrollment->grade) {
                throw new BusinessRuleException('Pengajuan yang sudah memiliki nilai tidak dapat ditarik.');
            }
            $enrollment->delete();
        });
    }

    private function assertOpen(): void
    {
        if (! Setting::current()->krs_open) {
            throw new BusinessRuleException('Periode KRS sedang ditutup.');
        }
    }
}
