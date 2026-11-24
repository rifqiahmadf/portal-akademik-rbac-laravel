<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $enrollment_id
 * @property int $score
 */
class Grade extends Model
{
    protected $primaryKey = 'enrollment_id';

    public $incrementing = false;

    protected $fillable = ['enrollment_id', 'score'];

    protected function casts(): array
    {
        return ['score' => 'integer'];
    }

    /** @return BelongsTo<Enrollment, $this> */
    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }
}
