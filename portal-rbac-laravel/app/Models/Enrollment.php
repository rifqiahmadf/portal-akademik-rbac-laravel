<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property int $id
 * @property int $student_id
 * @property int $course_id
 * @property-read Course $course
 * @property-read User $student
 * @property-read Grade|null $grade
 */
class Enrollment extends Model
{
    public $timestamps = false;

    protected $fillable = ['student_id', 'course_id'];

    protected function casts(): array
    {
        return ['submitted_at' => 'datetime'];
    }

    /** @return BelongsTo<User, $this> */
    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    /** @return BelongsTo<Course, $this> */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /** @return HasOne<Grade, $this> */
    public function grade(): HasOne
    {
        return $this->hasOne(Grade::class);
    }
}
