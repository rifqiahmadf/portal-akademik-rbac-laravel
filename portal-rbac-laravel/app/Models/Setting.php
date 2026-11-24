<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Konfigurasi singleton (id = 1). */
/**
 * @property int $id
 * @property string $institution
 * @property bool $krs_open
 */
class Setting extends Model
{
    public $incrementing = false;

    protected $fillable = ['institution', 'krs_open'];

    protected function casts(): array
    {
        return ['krs_open' => 'boolean'];
    }

    public static function current(): self
    {
        return self::query()->findOrFail(1);
    }
}
