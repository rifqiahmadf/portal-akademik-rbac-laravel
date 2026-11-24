<?php

namespace App\Http\Requests;

use App\Models\Registration;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRegistrationRequest extends FormRequest
{
    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'program' => ['required', Rule::in(Registration::PROGRAMS)],
            'cohort' => ['required', 'integer', 'between:2000,2100'],
            'status' => ['required', Rule::in(Registration::STATUSES)],
        ];
    }

    public function attributes(): array
    {
        return ['program' => 'Program studi', 'cohort' => 'Angkatan', 'status' => 'Status registrasi'];
    }
}
