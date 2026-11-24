<?php

namespace App\Http\Requests;

use App\Enums\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAccountRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'username' => strtolower((string) $this->input('username')),
            'email' => strtolower((string) $this->input('email')),
        ]);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'username' => ['required', 'string', 'min:3', 'max:32', 'regex:/^[a-z0-9._-]+$/', 'unique:users,username'],
            'name' => ['required', 'string', 'min:2', 'max:80'],
            'email' => ['required', 'email', 'max:100', 'unique:users,email'],
            'role' => ['required', Rule::in([Role::Mahasiswa->value, Role::Dosen->value, Role::Operator->value])],
            'password' => ['required', 'string', 'min:12', 'max:128'],
        ];
    }

    public function attributes(): array
    {
        return ['username' => 'Nama pengguna', 'name' => 'Nama lengkap', 'email' => 'Email', 'role' => 'Peran akun', 'password' => 'Kata sandi'];
    }
}
