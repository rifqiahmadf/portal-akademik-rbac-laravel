<?php

namespace App\Enums;

enum Role: string
{
    case Mahasiswa = 'mahasiswa';
    case Dosen = 'dosen';
    case Operator = 'operator';
    case Administrator = 'administrator';

    public function label(): string
    {
        return ucfirst($this->value);
    }
}
