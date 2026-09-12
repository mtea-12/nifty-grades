# Pencarian Siswa di Halaman Nilai per Siswa

## Tujuan
Di halaman **Nilai per Siswa** (`/nilai-siswa`), filter dropdown kelas tetap dipertahankan, tetapi pemilihan siswa diganti dari dropdown menjadi **kolom pencarian**: admin mengetik minimal 3 huruf pertama dari nama atau NIS siswa, lalu daftar saran muncul untuk dipilih.

## Perubahan

### `src/routes/nilai-siswa.tsx`
1. **Dropdown kelas tetap ada** — berfungsi seperti sekarang: mempersempit daftar siswa yang dicari.
2. **Ganti dropdown "Pilih siswa" menjadi input pencarian dengan saran (combobox):**
   - Input teks dengan placeholder "Ketik min. 3 huruf nama/NIS siswa…".
   - Saran hanya muncul setelah pengguna mengetik **minimal 3 karakter**.
   - Pencarian cocok terhadap **nama dan NIS** (huruf kecil, awalan/substring), terbatas pada siswa di kelas yang dipilih pada filter kelas (atau semua kelas jika filter "Semua Kelas").
   - Daftar saran menampilkan `NIS · Nama — Kelas`, dibatasi maksimal ±20 hasil, bisa dipilih dengan klik (dan navigasi keyboard: panah atas/bawah + Enter, Esc menutup).
   - Memilih saran akan mengisi `siswaId`, menampilkan nama siswa di input, menutup daftar, dan mereset draf nilai (sama seperti perilaku dropdown saat ini).
3. **Sinkronisasi dengan URL** (`?siswa=…`): jika halaman dibuka dengan parameter siswa, input otomatis terisi nama siswa tersebut (menggantikan logika `setSiswaId` yang sudah ada).
4. **Status kosong:** jika kurang dari 3 huruf, tampilkan petunjuk "Ketik minimal 3 huruf…" di bawah input; jika tidak ada hasil, tampilkan "Siswa tidak ditemukan".
5. Tombol "x" kecil di dalam input untuk menghapus pilihan siswa (reset ke kosong).

### Tidak berubah
- Tabel nilai per mapel, impor Excel/CSV, simpan nilai, dan filter pencarian mapel tetap sama.
- Tidak ada perubahan database.

## Verifikasi
1. `bunx tsgo --noEmit` tanpa error.
2. Uji di browser (login admin): ketik 1–2 huruf (tidak ada saran), 3 huruf (saran muncul), pilih siswa, tabel nilai tampil; filter kelas mempersempit hasil pencarian; parameter `?siswa=` tetap berfungsi.
