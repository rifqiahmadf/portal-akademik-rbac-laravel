<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('registrations', function (Blueprint $table) {
            $table->foreignId('student_id')->primary()->constrained('users')->cascadeOnDelete();
            $table->string('program', 40);
            $table->unsignedSmallInteger('cohort');
            $table->string('status', 12);
            $table->timestamps();
        });

        Schema::create('courses', function (Blueprint $table) {
            $table->unsignedInteger('id')->primary();
            $table->string('code', 12)->unique();
            $table->string('name', 80);
            $table->unsignedTinyInteger('credits');
            $table->string('schedule', 40);
            $table->foreignId('lecturer_id')->constrained('users');
            $table->timestamps();
        });

        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('registrations', 'student_id')->cascadeOnDelete();
            $table->unsignedInteger('course_id');
            $table->foreign('course_id')->references('id')->on('courses');
            $table->timestamp('submitted_at')->useCurrent();
            $table->unique(['student_id', 'course_id']);
            $table->index('course_id');
        });

        Schema::create('grades', function (Blueprint $table) {
            $table->foreignId('enrollment_id')->primary()->constrained('enrollments')->cascadeOnDelete();
            $table->unsignedTinyInteger('score');
            $table->timestamps();
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->unsignedTinyInteger('id')->primary();
            $table->string('institution', 80);
            $table->boolean('krs_open')->default(true);
            $table->timestamps();
        });

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE users ADD CONSTRAINT valid_role CHECK (role IN ('mahasiswa','dosen','operator','administrator'))");
            DB::statement("ALTER TABLE registrations ADD CONSTRAINT valid_registration_status CHECK (status IN ('Aktif','Cuti','Nonaktif'))");
            DB::statement('ALTER TABLE registrations ADD CONSTRAINT valid_cohort CHECK (cohort BETWEEN 2000 AND 2100)');
            DB::statement('ALTER TABLE grades ADD CONSTRAINT valid_grade_score CHECK (score BETWEEN 0 AND 100)');
            DB::statement('ALTER TABLE settings ADD CONSTRAINT singleton_settings CHECK (id = 1)');
        }
    }

    public function down(): void
    {
        foreach (['settings', 'grades', 'enrollments', 'courses', 'registrations'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
