// Tipe data & utilitas penilaian
// SMK Muhammadiyah 1 Paguyangan

export const SEKOLAH_DEFAULT = {
  nama: "SMK Muhammadiyah 1 Paguyangan",
  alamat: "-",
  npsn: "-",
  kepsek: "-",
};

export type Peran = "admin" | "guru" | "wali" | "siswa";

export type Sekolah = {
  id: string;
  nama: string;
  alamat: string;
  npsn: string;
  kepsek: string;
};

export type TahunAjaran = {
  id: string;
  tahun: string;
  semester: string;
  aktif: boolean;
};

export type Kelas = {
  id: string;
  nama: string;
  tingkat: string;
  jurusan: string;
  waliId: string | null;
};

export type Mapel = {
  id: string;
  kode: string;
  nama: string;
  kelompok: string;
  kkm: number;
};

export type Guru = {
  id: string;
  nip: string;
  nama: string;
  jk: string;
  mapelId: string | null;
  telepon: string;
};

export type Siswa = {
  id: string;
  nis: string;
  nisn: string;
  nama: string;
  jk: string;
  kelasId: string | null;
  wali: string;
  tanggalLahir: string | null;
};

export type Nilai = {
  siswaId: string;
  mapelId: string;
  tugas: number;
  pts: number;
  pas: number;
  hadir?: number;
  pertemuan?: number;
  tahunAjaranId?: string;
};

export function nilaiAkhir(n: Pick<Nilai, "tugas" | "pts" | "pas">) {
  if (!n.tugas || !n.pts || !n.pas) return 0;
  return Math.round(n.tugas * 0.3 + n.pts * 0.3 + n.pas * 0.4);
}

/** Persentase kehadiran 0-100. */
export function persenHadir(hadir: number, pertemuan: number) {
  if (!pertemuan || pertemuan <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((hadir / pertemuan) * 100)));
}

/** Bobot khusus halaman Nilai Per-semester: Tugas 20%, PTS 20%, PAS 30%, Absensi 30%. */
export function nilaiAkhirSemester(n: {
  tugas: number;
  pts: number;
  pas: number;
  hadir: number;
  pertemuan: number;
}) {
  if (!n.tugas || !n.pts || !n.pas || !n.pertemuan) return 0;
  const absen = persenHadir(n.hadir, n.pertemuan);
  return Math.round(n.tugas * 0.2 + n.pts * 0.2 + n.pas * 0.3 + absen * 0.3);
}

export function predikat(nilai: number) {
  if (nilai >= 90) return { huruf: "A", label: "Sangat Baik" };
  if (nilai >= 80) return { huruf: "B", label: "Baik" };
  if (nilai >= 70) return { huruf: "C", label: "Cukup" };
  if (nilai > 0) return { huruf: "D", label: "Perlu Bimbingan" };
  return { huruf: "-", label: "Belum Dinilai" };
}
