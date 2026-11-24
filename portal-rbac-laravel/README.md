# Portal Akademik · Demo RBAC (Laravel)

Portal akademik demonstrasi dengan **kontrol akses berbasis peran (RBAC)** untuk empat peran (mahasiswa, dosen, operator, administrator) dan enam aktivitas. Versi ini adalah porting dari prototipe Next.js/Prisma ke **Laravel 13** dengan PHP 8.4, PostgreSQL 17, dan Docker. Seluruh nama, akun, kelas, dan nilai adalah data fiktif.

## Menjalankan dengan Docker

Prasyarat: Docker Engine dan Docker Compose. PHP, Composer, dan Node tidak perlu dipasang di host.

```bash
docker compose up --build -d --wait
```

Buka <http://127.0.0.1:8036>. Untuk port lain: `RBAC_PORT=8037 docker compose up -d --wait`. Port hanya dibuka pada loopback host.

Saat start, container `app` menjalankan `migrate` dan `db:seed` (idempoten), membuat `APP_KEY` sekali dan menyimpannya di volume `storage`, lalu men-cache konfigurasi, rute, dan view.

```bash
docker compose down        # berhenti, data tetap ada
docker compose down -v     # berhenti dan hapus data
```

## Akun demo

Kata sandi awal semua akun: `AkademikDemo!26`.

| Peran         | Akun utama | Akun tambahan |
| ------------- | ---------- | ------------- |
| Mahasiswa     | `nara`     | `bima`        |
| Dosen         | `ratih`    | `yudha`       |
| Operator      | `sinta`    |               |
| Administrator | `arya`     |               |

## Matriks RBAC

**L** Lihat · **T** Tambah · **U** Ubah · **H** Hapus · **—** ditolak.

| Aktivitas            | Mahasiswa | Dosen   | Operator | Administrator |
| -------------------- | --------- | ------- | -------- | ------------- |
| Lihat data sendiri   | L         | L       | L        | L             |
| Ajukan KRS           | L, T, H   | —       | —        | —             |
| Input nilai          | —         | L, T, U | —        | —             |
| Ubah data registrasi | —         | —       | L, U     | —             |
| Kelola akun          | —         | —       | —        | L, T, U       |
| Konfigurasi sistem   | —         | —       | —        | L, U          |

Izin peran dibatasi lagi oleh kepemilikan objek (dosen hanya menilai kelas ampuan, mahasiswa hanya mengelola KRS sendiri) dan kondisi bisnis (periode KRS dibuka, registrasi Aktif, KRS belum bernilai). Rincian: lihat dokumen laporan.

## Arsitektur

```
Browser ──► web (nginx-unprivileged :8080) ──FastCGI──► app (PHP-FPM 8.4) ──► db (PostgreSQL 17)
```

| Lapisan                  | Lokasi                                                                       |
| ------------------------ | ---------------------------------------------------------------------------- |
| Definisi matriks izin    | `app/Support/Rbac.php`, enum `app/Enums/*`                                   |
| Penjaga rute (Gate)      | `AppServiceProvider` (Gate `rbac`), `app/Http/Middleware/EnsureRbac.php`     |
| Validasi input           | `app/Http/Requests/*`                                                        |
| Batas objek              | `app/Policies/EnrollmentPolicy.php`, query terbatas pada pengguna            |
| Aturan bisnis            | `app/Services/KrsService.php`, `AccountService.php`                          |
| Skema & seed             | `database/migrations`, `database/seeders/DatabaseSeeder.php`                 |
| Header keamanan          | `app/Http/Middleware/SecurityHeaders.php`                                    |

## Kualitas dan pengujian

```bash
# Pengujian otomatis (PostgreSQL, database terpisah akademik_uji)
docker compose --profile test run --rm test

# Gaya kode dan analisis statis
docker compose --profile test run --rm test vendor/bin/pint --test
docker compose --profile test run --rm test vendor/bin/phpstan analyse --memory-limit=512M
```

Basis data `akademik_uji` dibuat otomatis pada volume baru. Pada volume lama: `docker compose exec db createdb -U portal_app akademik_uji`.

Hasil terakhir tercatat di `bukti/`: 175 tes lulus (263 assertion), Pint lulus, PHPStan level 6 tanpa temuan, `composer audit` dan `npm audit` tanpa kerentanan.

## Pengembangan tanpa Docker penuh

Salin `.env.example` ke `.env`, arahkan `DB_*` ke PostgreSQL, lalu `composer setup` (membutuhkan PHP 8.4 dan Node 24 di host).

## Konfigurasi

| Variabel           | Bawaan                    | Keterangan                                          |
| ------------------ | ------------------------- | --------------------------------------------------- |
| `RBAC_PORT`        | `8036`                    | Port loopback host untuk portal                     |
| `RBAC_DB_NAME`     | `akademik`                | Nama database aplikasi                              |
| `RBAC_DB_PASSWORD` | `portal-app-demo-lokal`   | **Ganti** untuk lingkungan selain demo lokal        |
| `APP_KEY`          | dibuat otomatis           | Isi manual agar konsisten antar-host                |

## Batasan

Demonstrasi lokal, bukan sistem produksi. Tidak ada audit log, pemulihan kata sandi, MFA, atau HTTPS bawaan; tambahkan sebelum dipakai dengan data nyata.
