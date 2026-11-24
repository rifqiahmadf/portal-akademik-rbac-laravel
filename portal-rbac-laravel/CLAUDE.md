# Portal Akademik RBAC (Laravel)

Panduan singkat untuk kontributor dan agen pengodean.

- Seluruh perintah PHP/Node dijalankan lewat Docker (lihat `README.md`); host tidak perlu PHP atau Composer.
- Satu sumber kebenaran izin: `app/Support/Rbac.php`. Rute dijaga middleware `rbac:{aktivitas},{tindakan}`; batas objek ada di `app/Policies`, aturan bisnis di `app/Services`.
- Setiap perubahan kebijakan wajib memperbarui tabel acuan di `tests/Unit/RbacPolicyTest.php` dan matriks pada dokumen.
- Sebelum commit: `vendor/bin/pint`, `vendor/bin/phpstan analyse`, dan `docker compose --profile test run --rm test` harus bersih.
- Jangan memakai data nyata. Semua akun dan nilai adalah data fiktif.
