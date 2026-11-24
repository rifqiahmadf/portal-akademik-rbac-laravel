<?php

namespace App\Services;

use App\Enums\Role;
use App\Exceptions\BusinessRuleException;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AccountService
{
    /** @param array{username: string, name: string, email: string, role: string, password: string} $data */
    public function create(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = User::query()->create([
                'username' => strtolower($data['username']),
                'name' => $data['name'],
                'email' => strtolower($data['email']),
                'role' => $data['role'],
                'password' => $data['password'],
                'active' => true,
            ]);
            if ($user->role === Role::Mahasiswa) {
                Registration::query()->create([
                    'student_id' => $user->id,
                    'program' => Registration::PROGRAMS[0],
                    'cohort' => 2026,
                    'status' => 'Nonaktif',
                ]);
            }

            return $user;
        });
    }

    /** @param array{name: string, email: string, active: bool} $data */
    public function update(User $target, array $data): void
    {
        if ($target->role === Role::Administrator) {
            throw new BusinessRuleException('Perubahan akun administrator tidak tersedia di portal ini.');
        }
        DB::transaction(function () use ($target, $data) {
            $target->update([
                'name' => $data['name'],
                'email' => strtolower($data['email']),
                'active' => $data['active'],
            ]);
            if (! $target->active) {
                DB::table('sessions')->where('user_id', $target->id)->delete();
            }
        });
    }
}
