<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateConfigurationRequest;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

class ConfigurationController extends Controller
{
    public function show(): View
    {
        return view('portal.configuration', ['setting' => Setting::current()]);
    }

    public function update(UpdateConfigurationRequest $request): RedirectResponse
    {
        Setting::current()->update($request->validated());

        return back()->with('status', 'Konfigurasi disimpan.');
    }
}
