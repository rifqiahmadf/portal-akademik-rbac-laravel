<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ConfigurationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\KrsController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RegistrationController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/portal');

Route::middleware('guest')->group(function () {
    Route::get('/masuk', [AuthController::class, 'create'])->name('login');
    Route::post('/masuk', [AuthController::class, 'store'])->name('login.store');
});

Route::middleware('auth')->group(function () {
    Route::post('/keluar', [AuthController::class, 'destroy'])->name('logout');

    Route::prefix('portal')->name('portal.')->group(function () {
        Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('/matriks', [DashboardController::class, 'matrix'])->name('matrix');

        // Setiap rute dijaga Gate "rbac" dengan pasangan (aktivitas, tindakan) dari matriks.
        Route::get('/profil', [ProfileController::class, 'show'])->middleware('rbac:me,view')->name('profile');

        Route::get('/krs', [KrsController::class, 'index'])->middleware('rbac:krs,view')->name('krs');
        Route::post('/krs/{course}', [KrsController::class, 'store'])->middleware('rbac:krs,add')->name('krs.store');
        Route::delete('/krs/{course}', [KrsController::class, 'destroy'])->middleware('rbac:krs,remove')->name('krs.destroy');

        Route::get('/nilai', [GradeController::class, 'index'])->middleware('rbac:nilai,view')->name('grades');
        Route::post('/nilai/{enrollment}', [GradeController::class, 'store'])->middleware('rbac:nilai,add')->name('grades.store');
        Route::patch('/nilai/{enrollment}', [GradeController::class, 'update'])->middleware('rbac:nilai,edit')->name('grades.update');

        Route::get('/registrasi', [RegistrationController::class, 'index'])->middleware('rbac:registrasi,view')->name('registrations');
        Route::patch('/registrasi/{registration}', [RegistrationController::class, 'update'])->middleware('rbac:registrasi,edit')->name('registrations.update');

        Route::get('/akun', [AccountController::class, 'index'])->middleware('rbac:akun,view')->name('accounts');
        Route::post('/akun', [AccountController::class, 'store'])->middleware('rbac:akun,add')->name('accounts.store');
        Route::patch('/akun/{user}', [AccountController::class, 'update'])->middleware('rbac:akun,edit')->name('accounts.update');

        Route::get('/konfigurasi', [ConfigurationController::class, 'show'])->middleware('rbac:konfigurasi,view')->name('configuration');
        Route::patch('/konfigurasi', [ConfigurationController::class, 'update'])->middleware('rbac:konfigurasi,edit')->name('configuration.update');
    });
});
