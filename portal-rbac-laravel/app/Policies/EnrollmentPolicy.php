<?php

namespace App\Policies;

use App\Models\Enrollment;
use App\Models\User;

/** Pembatasan objek: dosen hanya menilai peserta kelas yang ia ampu. */
class EnrollmentPolicy
{
    public function grade(User $user, Enrollment $enrollment): bool
    {
        return $enrollment->course->lecturer_id === $user->id;
    }
}
