<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateConfigurationRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge(['krs_open' => $this->boolean('krs_open')]);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'institution' => ['required', 'string', 'min:2', 'max:80'],
            'krs_open' => ['required', 'boolean'],
        ];
    }

    public function attributes(): array
    {
        return ['institution' => 'Nama institusi'];
    }
}
