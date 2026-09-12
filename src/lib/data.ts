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
};

export type Nilai = {
  siswaId: string;
  mapelId: string;
  tugas: number;
  pts: number;
  pas: number;
};

export function nilaiAkhir(n: Pick<Nilai, "tugas" | "pts" | "pas">) {
  if (!n.tugas || !n.pts || !n.pas) return 0;
  return Math.round(n.tugas * 0.3 + n.pts * 0.3 + n.pas * 0.4);
}

export function predikat(nilai: number) {
  if (nilai >= 90) return { huruf: "A", label: "Sangat Baik" };
  if (nilai >= 80) return { huruf: "B", label: "Baik" };
  if (nilai >= 70) return { huruf: "C", label: "Cukup" };
  if (nilai > 0) return { huruf: "D", label: "Perlu Bimbingan" };
  return { huruf: "-", label: "Belum Dinilai" };
}
