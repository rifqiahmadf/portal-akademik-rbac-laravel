<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateRegistrationRequest;
use App\Models\Registration;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

class RegistrationController extends Controller
{
    public function index(): View
    {
        return view('portal.registrations', [
            'records' => Registration::query()->with('student')->get()->sortBy('student.name'),
            'programs' => Registration::PROGRAMS,
            'statuses' => Registration::STATUSES,
        ]);
    }

    public function update(UpdateRegistrationRequest $request, Registration $registration): RedirectResponse
    {
        $registration->update($request->validated());

        return back()->with('status', 'Registrasi diperbarui.');
    }
}
