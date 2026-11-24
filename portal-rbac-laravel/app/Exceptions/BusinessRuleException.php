<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\RedirectResponse;

/** Pelanggaran aturan bisnis (mis. periode KRS tutup). Ditampilkan sebagai pesan, bukan error 500. */
class BusinessRuleException extends Exception
{
    public function render(): RedirectResponse
    {
        return back()->with('error', $this->getMessage());
    }
}
