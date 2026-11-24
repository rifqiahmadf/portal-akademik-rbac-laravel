<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $student_id
 * @property string $program
 * @property int $cohort
 * @property string $status
 * @property-read User $student
 */
class Registration extends Model
{
    public const PROGRAMS = ['Informatika', 'Sistem Informasi', 'Teknik Komputer'];

    public const STATUSES = ['Aktif', 'Cuti', 'Nonaktif'];

    protected $primaryKey = 'student_id';

    public $incrementing = false;

    protected $fillable = ['student_id', 'program', 'cohort', 'status'];

    protected function casts(): array
    {
        return ['cohort' => 'integer'];
    }

    /** @return BelongsTo<User, $this> */
    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    /** @return HasMany<Enrollment, $this> */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class, 'student_id', 'student_id');
    }

    public function isActive(): bool
    {
        return $this->status === 'Aktif';
    }
}
