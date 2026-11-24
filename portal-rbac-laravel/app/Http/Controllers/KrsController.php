<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Setting;
use App\Services\KrsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class KrsController extends Controller
{
    public function __construct(private readonly KrsService $krs) {}

    public function index(Request $request): View
    {
        $user = $request->user()->load('registration');

        return view('portal.krs', [
            'courses' => Course::query()->with('lecturer')->orderBy('code')->get(),
            'enrollments' => Enrollment::query()->with('grade')->where('student_id', $user->id)->get()->keyBy('course_id'),
            'open' => Setting::current()->krs_open,
            'registrationStatus' => $user->registration?->status,
        ]);
    }

    public function store(Request $request, Course $course): RedirectResponse
    {
        $this->krs->submit($request->user(), $course);

        return back()->with('status', 'Kelas berhasil diajukan.');
    }

    public function destroy(Request $request, Course $course): RedirectResponse
    {
        $this->krs->withdraw($request->user(), $course);

        return back()->with('status', 'Pengajuan KRS ditarik.');
    }
}
