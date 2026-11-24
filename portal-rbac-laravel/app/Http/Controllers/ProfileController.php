<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Illuminate\View\View;

class ProfileController extends Controller
{
    public function show(Request $request): View
    {
        $user = $request->user();
        $study = collect();
        if ($user->role === Role::Mahasiswa) {
            $user->load('registration');
            $study = Enrollment::query()
                ->with(['course.lecturer', 'grade'])
                ->where('student_id', $user->id)
                ->get()
                ->sortBy('course.code');
        }

        return view('portal.profile', ['user' => $user, 'study' => $study]);
    }
}
