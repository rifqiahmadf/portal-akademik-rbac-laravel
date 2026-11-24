<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\View\View;

class AuthController extends Controller
{
    public function create(): View
    {
        return view('auth.login', [
            'institution' => Setting::current()->institution,
            'accounts' => ['nara' => 'Mahasiswa', 'ratih' => 'Dosen', 'sinta' => 'Operator', 'arya' => 'Administrator'],
        ]);
    }

    public function store(LoginRequest $request): RedirectResponse
    {
        $username = Str::lower($request->string('username')->toString());
        $key = 'login:'.$username.'|'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            return back()->withErrors(['username' => 'Terlalu banyak percobaan. Coba lagi dalam '.RateLimiter::availableIn($key).' detik.'])->onlyInput('username');
        }

        $credentials = ['username' => $username, 'password' => $request->input('password'), 'active' => true];
        if (! Auth::attempt($credentials)) {
            RateLimiter::hit($key, 60);

            return back()->withErrors(['username' => 'Nama pengguna atau kata sandi tidak cocok, atau akun nonaktif.'])->onlyInput('username');
        }

        RateLimiter::clear($key);
        $request->session()->regenerate();

        return redirect()->intended(route('portal.dashboard'));
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
