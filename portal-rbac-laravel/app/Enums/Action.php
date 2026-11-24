<?php

namespace App\Enums;

enum Action: string
{
    case View = 'view';
    case Add = 'add';
    case Edit = 'edit';
    case Remove = 'remove';

    public function label(): string
    {
        return match ($this) {
            self::View => 'Lihat',
            self::Add => 'Tambah',
            self::Edit => 'Ubah',
            self::Remove => 'Hapus',
        };
    }

    public function initial(): string
    {
        return mb_substr($this->label(), 0, 1);
    }
}
