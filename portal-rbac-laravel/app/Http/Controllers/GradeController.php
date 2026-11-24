<?php

namespace App\Http\Controllers;

use App\Exceptions\BusinessRuleException;
use App\Http\Requests\UpdateGradeRequest;
use App\Models\Course;
use App\Models\Enrollment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\View\View;

class GradeController extends Controller
{
    public function index(Request $request): View
    {
        $classes = Course::query()
            ->where('lecturer_id', $request->user()->id)
            ->with(['enrollments.student', 'enrollments.grade'])
            ->orderBy('code')
            ->get();

        return view('portal.grades', ['classes' => $classes]);
    }

    public function store(UpdateGradeRequest $request, Enrollment $enrollment): RedirectResponse
    {
        Gate::authorize('grade', $enrollment);
        if ($enrollment->grade()->exists()) {
            throw new BusinessRuleException('Nilai sudah ada. Gunakan tindakan ubah.');
        }
        $enrollment->grade()->create(['score' => $request->integer('score')]);

        return back()->with('status', 'Nilai disimpan.');
    }

    public function update(UpdateGradeRequest $request, Enrollment $enrollment): RedirectResponse
    {
        Gate::authorize('grade', $enrollment);
        $grade = $enrollment->grade;
        if (! $grade) {
            throw new BusinessRuleException('Nilai belum ada. Gunakan tindakan tambah.');
        }
        $grade->update(['score' => $request->integer('score')]);

        return back()->with('status', 'Nilai disimpan.');
    }
}
