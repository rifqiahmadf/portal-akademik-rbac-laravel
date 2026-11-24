# Portal Akademik · Demo RBAC

Demonstrasi kontrol akses berbasis peran (RBAC) untuk sistem akademik: 4 peran (mahasiswa, dosen, operator, administrator) × 6 aktivitas. Semua data bersifat **fiktif**.

| Folder | Isi |
| --- | --- |
| [`portal-rbac-laravel/`](portal-rbac-laravel) | **Aplikasi utama**: Laravel 13, PHP 8.4, PostgreSQL 17, Tailwind CSS 4, Docker Compose |
| [`portal-rbac-laravel/docs/`](portal-rbac-laravel/docs) | Laporan RBAC dan Dokumen Arsitektur (DOCX + PDF) serta diagram |
| [`prototipe-nextjs/`](prototipe-nextjs) | Prototipe awal (Next.js + Prisma), disimpan sebagai referensi |
| [`arsip-v1/`](arsip-v1) | Laporan dan diagram versi 1.0 |

## Menjalankan di perangkat lain

**Prasyarat:** Git, Docker Engine, dan Docker Compose v2 (Docker Desktop untuk Windows/macOS). PHP, Composer, dan Node **tidak** perlu dipasang. Perlu internet pada build pertama.

```bash
git clone <URL-REPO-INI>
cd <nama-repo>/portal-rbac-laravel
docker compose up --build -d --wait
```

Buka <http://127.0.0.1:8036>. Jika port itu terpakai: `RBAC_PORT=8037 docker compose up --build -d --wait` (Windows PowerShell: `$env:RBAC_PORT=8037; docker compose up --build -d --wait`).

Saat start, aplikasi otomatis menjalankan migrasi dan mengisi data demo.

**Akun demo** (kata sandi semua: `AkademikDemo!26`)

| Peran | Akun |
| --- | --- |
| Mahasiswa | `nara`, `bima` |
| Dosen | `ratih`, `yudha` |
| Operator | `sinta` |
| Administrator | `arya` |

**Menjalankan pengujian** (175 tes, PostgreSQL):

```bash
docker compose --profile test run --rm test
```

**Berhenti:** `docker compose down` (data tetap) atau `docker compose down -v` (hapus data).

Catatan: ganti `RBAC_DB_PASSWORD` bila dipakai di luar demo lokal. Detail konfigurasi, backup, dan pemecahan masalah ada di `portal-rbac-laravel/README.md` dan dokumen Arsitektur dan Panduan Operasional.
