import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";
import {
  SEKOLAH_DEFAULT,
  type Guru,
  type Kelas,
  type Mapel,
  type Nilai,
  type Sekolah,
  type Siswa,
  type TahunAjaran,
} from "./data";

type Semua = {
  sekolah: Sekolah;
  tahunAjaran: TahunAjaran[];
  mapel: Mapel[];
  guru: Guru[];
  kelas: Kelas[];
  siswa: Siswa[];
  mapelKelas: Record<string, string[]>;
  nilai: Nilai[];
};

const KOSONG: Semua = {
  sekolah: { id: "", ...SEKOLAH_DEFAULT },
  tahunAjaran: [],
  mapel: [],
  guru: [],
  kelas: [],
  siswa: [],
  mapelKelas: {},
  nilai: [],
};

async function ambilSemua(): Promise<Semua> {
  const [sekolah, ta, mapel, guru, kelas, km, siswa, nilai] = await Promise.all([
    supabase.from("sekolah").select("*").limit(1).maybeSingle(),
    supabase.from("tahun_ajaran").select("*").order("tahun", { ascending: false }),
    supabase.from("mata_pelajaran").select("*").order("kode"),
    supabase.from("guru").select("*").order("nama"),
    supabase.from("kelas").select("*").order("nama"),
    supabase.from("kelas_mapel").select("*"),
    supabase.from("siswa").select("*").order("nis"),
    supabase.from("nilai").select("siswa_id, mapel_id, tugas, pts, pas"),
  ]);

  const galat = [sekolah, ta, mapel, guru, kelas, km, siswa, nilai].find((r) => r.error);
  if (galat?.error) throw new Error(galat.error.message);

  const petaMapelKelas: Record<string, string[]> = {};
  (km.data ?? []).forEach((r) => {
    const daftar = petaMapelKelas[r.kelas_id] ?? [];
    daftar.push(r.mapel_id);
    petaMapelKelas[r.kelas_id] = daftar;
  });

  return {
    sekolah: sekolah.data
      ? {
          id: sekolah.data.id,
          nama: sekolah.data.nama,
          alamat: sekolah.data.alamat,
          npsn: sekolah.data.npsn,
          kepsek: sekolah.data.kepsek,
        }
      : KOSONG.sekolah,
    tahunAjaran: (ta.data ?? []).map((t) => ({
      id: t.id,
      tahun: t.tahun,
      semester: t.semester,
      aktif: t.aktif,
    })),
    mapel: (mapel.data ?? []).map((m) => ({
      id: m.id,
      kode: m.kode,
      nama: m.nama,
      kelompok: m.kelompok,
      kkm: m.kkm,
    })),
    guru: (guru.data ?? []).map((g) => ({
      id: g.id,
      nip: g.nip,
      nama: g.nama,
      jk: g.jk,
      mapelId: g.mapel_id,
      telepon: g.telepon,
    })),
    kelas: (kelas.data ?? []).map((k) => ({
      id: k.id,
      nama: k.nama,
      tingkat: k.tingkat,
      jurusan: k.jurusan,
      waliId: k.wali_id,
    })),
    siswa: (siswa.data ?? []).map((s) => ({
      id: s.id,
      nis: s.nis,
      nisn: s.nisn,
      nama: s.nama,
      jk: s.jk,
      kelasId: s.kelas_id,
      wali: s.wali,
    })),
    mapelKelas: petaMapelKelas,
    nilai: (nilai.data ?? []).map((n) => ({
      siswaId: n.siswa_id,
      mapelId: n.mapel_id,
      tugas: n.tugas,
      pts: n.pts,
      pas: n.pas,
    })),
  };
}

type Ctx = Semua & {
  memuat: boolean;
  galat: string | null;
  segarkan: () => Promise<void>;
  tahunAktifId: string | null;
  namaKelas: (id: string | null | undefined) => string;
  namaMapel: (id: string | null | undefined) => string;
  kodeMapel: (id: string | null | undefined) => string;
  namaGuru: (id: string | null | undefined) => string;
  kkmMapel: (id: string | null | undefined) => number;
  simpanNilai: (baris: Nilai[]) => Promise<void>;
};

const DataContext = React.createContext<Ctx | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { akun, siap } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["data-sekolah", akun?.id ?? "tamu"],
    queryFn: ambilSemua,
    enabled: siap && !!akun,
    staleTime: 30_000,
  });

  const isi = data ?? KOSONG;
  const tahunAktifId = isi.tahunAjaran.find((t) => t.aktif)?.id ?? isi.tahunAjaran[0]?.id ?? null;

  const segarkan = React.useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ["data-sekolah"] });
  }, [qc]);

  const simpanNilai = React.useCallback(
    async (baris: Nilai[]) => {
      if (!tahunAktifId) throw new Error("Tahun ajaran aktif belum tersedia.");
      const { error: e } = await supabase.from("nilai").upsert(
        baris.map((b) => ({
          siswa_id: b.siswaId,
          mapel_id: b.mapelId,
          tahun_ajaran_id: tahunAktifId,
          tugas: b.tugas,
          pts: b.pts,
          pas: b.pas,
        })),
        { onConflict: "siswa_id,mapel_id,tahun_ajaran_id" },
      );
      if (e) throw new Error(e.message);
      await segarkan();
    },
    [tahunAktifId, segarkan],
  );

  const value: Ctx = {
    ...isi,
    memuat: isLoading,
    galat: error ? (error as Error).message : null,
    segarkan,
    tahunAktifId,
    namaKelas: (id) => isi.kelas.find((k) => k.id === id)?.nama ?? "-",
    namaMapel: (id) => isi.mapel.find((m) => m.id === id)?.nama ?? "-",
    kodeMapel: (id) => isi.mapel.find((m) => m.id === id)?.kode ?? "-",
    namaGuru: (id) => isi.guru.find((g) => g.id === id)?.nama ?? "-",
    kkmMapel: (id) => isi.mapel.find((m) => m.id === id)?.kkm ?? 75,
    simpanNilai,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = React.useContext(DataContext);
  if (!ctx) throw new Error("useData harus dipakai di dalam DataProvider");
  return ctx;
}
