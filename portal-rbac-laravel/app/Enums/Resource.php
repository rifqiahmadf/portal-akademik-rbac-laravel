<?php

namespace App\Enums;

use App\Support\Rbac;

/**
 * Enam aktivitas yang diatur oleh matriks RBAC. Satu-satunya sumber kebenaran
 * izin ada di {@see Rbac}.
 */
enum Resource: string
{
    case Me = 'me';
    case Krs = 'krs';
    case Nilai = 'nilai';
    case Registrasi = 'registrasi';
    case Akun = 'akun';
    case Konfigurasi = 'konfigurasi';
}
