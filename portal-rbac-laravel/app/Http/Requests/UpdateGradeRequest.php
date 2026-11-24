<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGradeRequest extends FormRequest
{
    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return ['score' => ['required', 'integer', 'between:0,100']];
    }

    public function attributes(): array
    {
        return ['score' => 'Nilai'];
    }
}
