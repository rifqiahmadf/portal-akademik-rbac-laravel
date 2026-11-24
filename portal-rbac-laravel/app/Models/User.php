<?php

namespace App\Models;

use App\Enums\Role;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;

/**
 * @property int $id
 * @property string $username
 * @property string $name
 * @property string $email
 * @property Role $role
 * @property bool $active
 * @property-read Registration|null $registration
 */
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory;

    protected $fillable = ['username', 'name', 'email', 'role', 'password', 'active'];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'role' => Role::class,
            'password' => 'hashed',
            'active' => 'boolean',
        ];
    }

    /** @return HasOne<Registration, $this> */
    public function registration(): HasOne
    {
        return $this->hasOne(Registration::class, 'student_id');
    }

    /** @return HasMany<Course, $this> */
    public function taughtCourses(): HasMany
    {
        return $this->hasMany(Course::class, 'lecturer_id');
    }

    public function hasRole(Role ...$roles): bool
    {
        return in_array($this->role, $roles, true);
    }
}
