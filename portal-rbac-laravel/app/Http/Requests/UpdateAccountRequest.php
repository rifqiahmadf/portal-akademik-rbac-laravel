<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAccountRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => strtolower((string) $this->input('email')),
            'active' => $this->boolean('active'),
        ]);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:80'],
            'email' => ['required', 'email', 'max:100', Rule::unique('users', 'email')->ignore($this->route('user'))],
            'active' => ['required', 'boolean'],
        ];
    }

    public function attributes(): array
    {
        return ['name' => 'Nama lengkap', 'email' => 'Email'];
    }
}
