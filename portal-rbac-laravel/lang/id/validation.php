<?php

return [
    'required' => ':attribute wajib diisi.',
    'string' => ':attribute harus berupa teks.',
    'integer' => ':attribute harus berupa bilangan bulat.',
    'boolean' => ':attribute tidak valid.',
    'email' => ':attribute tidak valid.',
    'in' => ':attribute tidak valid.',
    'regex' => ':attribute tidak valid. Gunakan huruf kecil, angka, titik, setrip, atau garis bawah.',
    'unique' => ':attribute sudah dipakai.',
    'between' => [
        'numeric' => ':attribute harus berupa bilangan bulat :min–:max.',
        'string' => ':attribute harus berisi :min–:max karakter.',
    ],
    'min' => ['string' => ':attribute minimal :min karakter.', 'numeric' => ':attribute minimal :min.'],
    'max' => ['string' => ':attribute maksimal :max karakter.', 'numeric' => ':attribute maksimal :max.'],
    'attributes' => [],
];
