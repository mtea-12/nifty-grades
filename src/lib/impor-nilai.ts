import * as XLSX from "xlsx";
import type { Mapel, Nilai, Siswa } from "./data";

export type BarisImpor = {
  no: number;
  nis: string;
  namaSiswa: string;
  kodeMapel: string;
  namaMapel: string;
  tugas: number;
  pts: number;
  pas: number;
  siswaId: string | null;
  mapelId: string | null;
  pesan: string | null;
};

const ALIAS: Record<string, string> = {
  nis: "nis",
  nisn: "nis",
  no_induk: "nis",
  nomor_induk: "nis",
  kode: "kode",
  kode_mapel: "kode",
  kode_mata_pelajaran: "kode",
  mapel: "kode",
  mata_pelajaran: "kode",
  tugas: "tugas",
  nilai_tugas: "tugas",
  harian: "tugas",
  pts: "pts",
  uts: "pts",
  nilai_pts: "pts",
  pas: "pas",
  uas: "pas",
  nilai_pas: "pas",
};

function kunci(h: string) {
  const k = h.trim().toLowerCase().replace(/[\s.-]+/g, "_");
  return ALIAS[k] ?? k;
}

function angka(v: unknown) {
  const n = Math.round(Number(String(v ?? "").replace(",", ".").trim()));
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

/** Baca file Excel (.xlsx/.xls) atau CSV menjadi baris objek berkunci baku. */
export async function bacaBerkas(file: File): Promise<Record<string, unknown>[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const nama = wb.SheetNames[0];
  if (!nama) return [];
  const sheet = wb.Sheets[nama];
  if (!sheet) return [];
  const mentah = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  return mentah.map((r) => {
    const out: Record<string, unknown> = {};
    Object.entries(r).forEach(([k, v]) => {
      out[kunci(k)] = v;
    });
    return out;
  });
}

/** Cocokkan baris mentah dengan data siswa & mata pelajaran. */
export function cocokkan(
  baris: Record<string, unknown>[],
  siswa: Siswa[],
  mapel: Mapel[],
): BarisImpor[] {
  const petaSiswa = new Map<string, Siswa>();
  siswa.forEach((s) => {
    petaSiswa.set(String(s.nis).trim().toLowerCase(), s);
    if (s.nisn) petaSiswa.set(String(s.nisn).trim().toLowerCase(), s);
  });
  const petaMapel = new Map<string, Mapel>();
  mapel.forEach((m) => {
    petaMapel.set(m.kode.trim().toLowerCase(), m);
    petaMapel.set(m.nama.trim().toLowerCase(), m);
  });

  return baris.map((r, i) => {
    const nis = String(r['nis'] ?? "").trim();
    const kode = String(r['kode'] ?? "").trim();
    const s = petaSiswa.get(nis.toLowerCase()) ?? null;
    const m = petaMapel.get(kode.toLowerCase()) ?? null;
    let pesan: string | null = null;
    if (!nis && !kode) pesan = "Baris kosong";
    else if (!s) pesan = `NIS "${nis}" tidak ditemukan`;
    else if (!m) pesan = `Mata pelajaran "${kode}" tidak ditemukan`;
    return {
      no: i + 1,
      nis,
      namaSiswa: s?.nama ?? "-",
      kodeMapel: kode,
      namaMapel: m?.nama ?? "-",
      tugas: angka(r['tugas']),
      pts: angka(r['pts']),
      pas: angka(r['pas']),
      siswaId: s?.id ?? null,
      mapelId: m?.id ?? null,
      pesan,
    };
  });
}

/** Ambil hanya baris valid, unik per siswa+mapel (baris terakhir menang). */
export function keNilai(baris: BarisImpor[]): Nilai[] {
  const peta = new Map<string, Nilai>();
  baris.forEach((b) => {
    if (!b.siswaId || !b.mapelId) return;
    peta.set(`${b.siswaId}|${b.mapelId}`, {
      siswaId: b.siswaId,
      mapelId: b.mapelId,
      tugas: b.tugas,
      pts: b.pts,
      pas: b.pas,
    });
  });
  return [...peta.values()];
}

/** Unduh template CSV berisi contoh isian. */
export function unduhTemplate(contoh: { nis: string; kode: string }[]) {
  const baris = [
    "nis,kode_mapel,tugas,pts,pas",
    ...(contoh.length > 0 ? contoh : [{ nis: "2024001", kode: "MTK" }]).map(
      (c) => `${c.nis},${c.kode},0,0,0`,
    ),
  ];
  const blob = new Blob(["\uFEFF" + baris.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "template-nilai.csv";
  a.click();
  URL.revokeObjectURL(url);
}
