# Nilai Per-semester

Halaman baru untuk admin: melihat dan mengisi nilai satu siswa untuk satu semester penuh, dengan perhitungan yang memasukkan kehadiran.

## Yang dibuat

Menu baru **Nilai Per-semester** (halaman lama "Nilai per Siswa" tetap ada dan tidak berubah).

Isi halaman:
- Pilihan **Tahun Ajaran** (mis. 2025/2026) dan **Semester** (Ganjil / Genap). Jika kombinasi itu belum ada di data Tahun Ajaran, muncul pesan agar dibuat dulu.
- Pilihan **Kelas** dan pencarian siswa minimal 3 huruf (sama seperti halaman Nilai per Siswa).
- Tabel semua mata pelajaran siswa tersebut dengan kolom isian: **Tugas**, **PTS**, **PAS**, **Hadir**, **Jumlah Pertemuan**.
- Kolom hitung otomatis: **% Kehadiran**, **Nilai Akhir**, **Status** (Tuntas / Remedial), plus ringkasan **rata-rata semester** di bagian atas.
- Tombol simpan menyimpan semua perubahan ke semester yang sedang dipilih.

## Rumus

```text
Kehadiran (%) = hadir / jumlah pertemuan x 100
Nilai Akhir   = Tugas 20% + PTS 20% + PAS 30% + Kehadiran 30%
```

Rumus ini hanya dipakai di halaman Nilai Per-semester. Halaman lain (input nilai guru, rapor, rekap, nilai per kelas) tetap memakai bobot lama 30/30/40.

Aturan isian: nilai 0–100; jumlah hadir tidak boleh melebihi jumlah pertemuan; bila pertemuan masih 0 maka kehadiran dihitung 0 dan baris ditandai belum lengkap.

## Detail teknis

**Database** (satu migrasi tambahan, aman untuk data yang ada):
- `public.nilai`: tambah kolom `hadir integer not null default 0` dan `pertemuan integer not null default 0`.

**Data layer (`src/lib/db.tsx`, `src/lib/data.ts`)**
- Query `nilai` ikut mengambil `tahun_ajaran_id`, `hadir`, `pertemuan`; tipe `Nilai` diperluas dengan `tahunAjaranId`, `hadir`, `pertemuan`.
- Halaman lama menyaring nilai berdasarkan tahun ajaran aktif agar perilakunya tetap sama.
- `simpanNilai` menerima parameter opsional `tahunAjaranId` (default: tahun aktif) dan ikut menyimpan `hadir`/`pertemuan`; upsert tetap `onConflict: siswa_id,mapel_id,tahun_ajaran_id`.

**Halaman baru `src/routes/nilai-semester.tsx`**
- Route `/nilai-semester` dengan `head()` sendiri (judul, deskripsi, og:title, og:description), akses khusus admin.
- Daftar tahun diambil dari `tahunAjaran` (unik per `tahun`); semester dipilih dari Ganjil/Genap dan dicocokkan ke baris `tahun_ajaran` yang sesuai.
- Helper hitung nilai semester ditaruh di `src/lib/data.ts` sebagai fungsi terpisah (`nilaiAkhirSemester`) agar tidak mengubah `nilaiAkhir` yang lama.

**Navigasi**: tambah item menu admin di `src/components/AppLayout.tsx`.

**Verifikasi**: typecheck, lalu uji di browser sebagai admin — pilih tahun/semester, cari siswa, isi nilai + kehadiran, simpan, dan pastikan nilai tersimpan pada semester yang benar.
