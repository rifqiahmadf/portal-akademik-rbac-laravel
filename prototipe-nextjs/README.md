# Portal Akademik · Demo RBAC

Aplikasi Next.js dengan TypeScript, shadcn/ui, Prisma ORM, dan PostgreSQL untuk tugas RBAC sistem akademik. Portal memuat empat peran, enam aktivitas, dan matriks akses interaktif di menu **Matriks akses**. Semua nama, akun, kelas, dan nilai disiapkan sebagai data fiktif.

## Jalankan dengan Docker

Dari direktori yang memuat `compose.yaml`, jalankan perintah berikut.

```bash
docker compose up --build -d --wait
```

Buka [Portal Akademik lokal](http://127.0.0.1:8036). Untuk memakai port lain, misalnya 8040, jalankan `RBAC_PORT=8040 docker compose up -d --wait`.

Build pertama mengambil image dasar dan paket npm jika cache Docker belum memuatnya. PostgreSQL berjalan di container `db`. Next.js, Prisma dan aset shadcn/ui berjalan secara lokal. Komputer host hanya perlu Docker Engine, Docker Compose, dan browser. Setelah kedua image aplikasi dan image PostgreSQL tersedia, jalankan secara offline dengan `docker compose up --no-build --pull never -d --wait`.

PostgreSQL menyimpan data di volume `portal-rbac_postgres`. Hanya portal yang membuka port host, pada alamat loopback. Aplikasi memakai akun database `portal_app`, dengan akses baca dan tulis pada tabel yang dipakai portal. Inisialisasi skema dijalankan oleh akun pemilik di container `db-init`. Jalankan `docker compose down` untuk menghentikan aplikasi sambil mempertahankan data.

### Upgrade dari volume SQLite

Hentikan container aplikasi lama sebelum menjalankan versi PostgreSQL, agar perubahan terakhir sudah lengkap saat dibaca.

```bash
docker compose stop app
docker compose up --build -d --wait
```

Jika PostgreSQL masih kosong dan `portal-rbac_akademik` berisi database lama, `db-init` mengimpor ketujuh tabel dalam satu transaksi. ID, data akademik, hash kata sandi, dan sesi dipertahankan. Waktu pengajuan KRS lama dibaca sebagai UTC dan disimpan dengan tipe tanggal dan waktu PostgreSQL. Volume SQLite dipasang hanya-baca di container inisialisasi. Pada instalasi baru dengan volume lama kosong, `db-init` mengisi data demo. Restart memakai data yang sudah tersimpan di PostgreSQL.

## Versi stack

| Teknologi                         | Versi                     |
| --------------------------------- | ------------------------- |
| Node.js LTS                       | 26.13.1                   |
| Next.js / React                   | 16.4.6 / 19.3.1           |
| TypeScript                        | 7.0.2                     |
| shadcn CLI / Tailwind CSS         | 4.23.0 / 4.3.5            |
| PostgreSQL                        | 19.0                      |
| Prisma CLI / klien ORM PostgreSQL | 8.0.0-rc.34 / 8.0.0-rc.24 |

Versi dipatok di `package.json` dan `package-lock.json`. Prisma 8 tersedia sebagai release candidate di tag npm `latest` saat migrasi ini. Build menghasilkan tipe dan kontrak runtime melalui `prisma contract emit`. Container `db-init` membuat dan memverifikasi skema PostgreSQL melalui `prisma db init`. [Status rilis Prisma](https://www.prisma.io/docs/orm/release-status).

## Pemeriksaan kode

Biome memeriksa format, urutan import, dan aturan lint pada seluruh kode aplikasi, komponen, CSS Tailwind, serta konfigurasi proyek.

```bash
npm run lint
npm run format:check
npm run lint:fix
```

`lint:fix` menerapkan perbaikan otomatis. Setelah mengubah file, jalankan `lint` dan `format:check` untuk memastikan tidak ada temuan tersisa.

## Akun demo

Kata sandi awal untuk keenam akun adalah `AkademikDemo!26`. Empat akun utama dapat dipilih di halaman masuk. Akun tambahan dapat dipakai untuk memeriksa pembatasan dalam peran yang sama.

| Peran         | Akun utama | Akun tambahan |
| ------------- | ---------- | ------------- |
| Mahasiswa     | `nara`     | `bima`        |
| Dosen         | `ratih`    | `yudha`       |
| Operator      | `sinta`    |               |
| Administrator | `arya`     |               |

## Matriks RBAC

**L** = Lihat, **T** = Tambah, **U** = Ubah, **H** = Hapus, **—** = ditolak. Kolom menyatakan izin aktivitas melalui portal dan API.

| Aktivitas            | Mahasiswa                                                                                                                                  | Dosen                                    | Operator                                             | Administrator                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------- |
| Lihat data sendiri   | L · akun, registrasi, dan nilai sendiri                                                                                                    | L · akun sendiri                         | L · akun sendiri                                     | L · akun sendiri                                        |
| Ajukan KRS           | L · kelas tersedia dan KRS sendiri. T · KRS sendiri saat periode buka dan registrasi aktif. H · KRS sendiri tanpa nilai saat periode buka. | —                                        | —                                                    | —                                                       |
| Input nilai          | —                                                                                                                                          | L, T, U · peserta dan nilai kelas ampuan | —                                                    | —                                                       |
| Ubah data registrasi | —                                                                                                                                          | —                                        | L, U · program studi, angkatan, dan status mahasiswa | —                                                       |
| Kelola akun          | —                                                                                                                                          | —                                        | —                                                    | L · ringkasan semua akun. T, U · akun nonadministrator. |
| Konfigurasi sistem   | —                                                                                                                                          | —                                        | —                                                    | L, U · nama institusi dan periode KRS                   |

Setiap peran menerima izin minimum untuk tugasnya. KRS memiliki izin hapus terbatas agar mahasiswa dapat menarik pengajuannya sebelum penilaian. Akun dinonaktifkan untuk mempertahankan relasi akademik dan sesi akun tersebut langsung dicabut. Peran akun ditetapkan saat pembuatan. Akun mahasiswa baru mendapat registrasi awal berstatus **Nonaktif** yang dapat diaktifkan oleh operator. Administrator memiliki akses administrasi akun dan konfigurasi. Pekerjaan akademik tetap ditangani peran yang ditunjuk.

Periode akademik pada data demo adalah Ganjil 2026/2027. Opsi periode KRS mengatur apakah pengajuan dan penarikan sedang dibuka. Nama institusi ditampilkan di halaman masuk dan portal.

Tabel KRS menampilkan kode kelas serta nama dosen dengan format `Nama Dosen (kode dosen)` dalam satu kolom. Kode kelas memakai kode mata kuliah yang sudah tersimpan, sedangkan kode dosen memakai ID akun dosen. Untuk jadwal lama yang hanya berisi hari dan jam mulai, jam selesai dihitung dari 50 menit per SKS. Rincian yang terlihat setelah pembaruan ini ada di [hasil verifikasi tabel kelas](bukti/hasil-verifikasi-tabel-kelas.txt).

## Ulangi pengujian

Jalankan dengan nama proyek Docker Compose terpisah dan database `akademik_uji`.

```bash
RBAC_DB_NAME=akademik_uji docker compose -p portal-rbac-uji up -d --wait db
RBAC_DB_NAME=akademik_uji docker compose -p portal-rbac-uji run --build --rm --no-deps db-init
RBAC_DB_NAME=akademik_uji docker compose -p portal-rbac-uji run --build --rm --no-deps app node --test tests/run.ts
docker compose -p portal-rbac-uji down -v
```

Perintah terakhir menghapus volume proyek uji agar pengujian berikutnya dimulai dari data demo baru. Pengujian mencakup 96 kombinasi empat peran, enam aktivitas, dan empat metode. Skenario lain memeriksa mutasi yang valid, pembatasan objek, sesi, dan persistensi. Lihat [hasil uji HTTP](bukti/hasil-uji-http.txt), [hasil uji browser](bukti/hasil-uji-browser.txt), [hasil uji migrasi](bukti/hasil-uji-migrasi.txt), dan [hasil pemeriksaan Biome](bukti/hasil-uji-biome.txt).

## Bagian kode

| File                                 | Isi                                                                                            |
| ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `lib/policy.ts`                      | Empat peran dan izin untuk enam aktivitas. Matriks portal membaca aturan yang sama dengan API. |
| `prisma/contract.prisma`             | Kontrak skema PostgreSQL, termasuk relasi dan batasan data.                                    |
| `prisma/migrate.ts`                  | Impor SQLite ke PostgreSQL atau data demo awal, sequence ID, dan izin role runtime.            |
| `lib/prisma.ts` dan `lib/session.ts` | Prisma Client PostgreSQL, transaksi, dan autentikasi sesi.                                     |
| `components/ui/`                     | Komponen shadcn/ui dari registry Radix Nova.                                                   |
| `lib/academic.ts`                    | Pengecekan izin, pembatasan data, validasi, dan transaksi.                                     |
| `app/api/[...resource]/route.ts`     | Autentikasi sesi, validasi asal permintaan, dan operasi HTTP.                                  |
| `tests/run.ts`                       | Pengujian integrasi terhadap aplikasi Docker.                                                  |

Portal dipublikasikan pada alamat loopback host. Seluruh demonstrasi dan pengujian dilakukan terhadap instance Docker lokal dengan data fiktif.
