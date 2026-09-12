import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Printer, Download } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Pilih } from "@/components/Tabel";
import { useAuth } from "@/lib/auth";
import { useNilai } from "@/lib/nilai-store";
import { nilaiAkhir, predikat } from "@/lib/data";
import { useData } from "@/lib/db";

export const Route = createFileRoute("/rapor")({
  validateSearch: (search: Record<string, unknown>) => ({
    siswa: typeof search["siswa"] === "string" ? (search["siswa"] as string) : "",
  }),

  head: () => ({
    meta: [
      { title: "Rapor Siswa — SMK Muhammadiyah 1 Paguyangan" },
      { name: "description", content: "Rapor semester siswa siap cetak lengkap dengan nilai, predikat, dan catatan wali kelas." },
      { property: "og:title", content: "Rapor Siswa — SMK Muhammadiyah 1 Paguyangan" },
      { property: "og:description", content: "Cetak atau unduh rapor semester siswa dengan format resmi sekolah." },
    ],
  }),
  component: Rapor,
});

function Rapor() {
  const { sekolah, kelas, kkmMapel, kodeMapel, mapelKelas, namaGuru, namaMapel, siswa } = useData();
  const { akun } = useAuth();
  const { nilai } = useNilai();
  const pencarian = Route.useSearch();

  const kelasWali = kelas.find((k) => k.waliId === akun?.refId);
  const daftarSiswa =
    akun?.peran === "siswa"
      ? siswa.filter((s) => s.id === akun.refId)
      : siswa.filter((s) => s.kelasId === kelasWali?.id);

  const [pilih, setPilih] = React.useState(pencarian.siswa || daftarSiswa[0]?.id || "");
  const s = siswa.find((x) => x.id === pilih) ?? daftarSiswa[0];

  if (!akun || !s) {
    return (
      <AppLayout judul="Rapor">
        <p className="text-sm text-muted-foreground">Data rapor belum tersedia untuk akun ini.</p>
      </AppLayout>
    );
  }

  const k = kelas.find((x) => x.id === s.kelasId)!;
  const daftarMapel = mapelKelas[k.id] ?? [];
  const baris = daftarMapel.map((mid) => {
    const n = nilai.find((x) => x.siswaId === s.id && x.mapelId === mid);
    const na = n ? nilaiAkhir(n) : 0;
    return { mid, na, kkm: kkmMapel(mid) };
  });
  const terisi = baris.filter((b) => b.na > 0);
  const rata = terisi.length ? Math.round(terisi.reduce((a, b) => a + b.na, 0) / terisi.length) : 0;
  const p = predikat(rata);

  return (
    <AppLayout
      judul={akun.peran === "siswa" ? "Rapor Saya" : "Rapor Siswa"}
      deskripsi="Laporan Hasil Belajar · Semester Ganjil 2025/2026"
      aksi={
        <div className="flex items-center gap-2">
          {daftarSiswa.length > 1 && (
            <Pilih
              label="Pilih siswa"
              nilai={s.id}
              onUbah={setPilih}
              opsi={daftarSiswa.map((x) => ({ value: x.id, label: x.nama }))}
            />
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-dark"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Cetak / Unduh PDF</span>
          </button>
        </div>
      }
    >
      <p className="no-print mb-4 flex items-center gap-2 rounded-lg border border-dashed border-border bg-card px-4 py-3 text-xs text-muted-foreground">
        <Download className="h-4 w-4 shrink-0" />
        Untuk mengunduh sebagai PDF, tekan tombol Cetak lalu pilih tujuan “Simpan sebagai PDF”.
      </p>

      <div className="print-area mx-auto max-w-4xl rounded-xl border border-border bg-card p-6 shadow-sm sm:p-10">
        <header className="border-b-4 border-double border-foreground/70 pb-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest">Majelis Pendidikan Dasar dan Menengah</p>
          <h2 className="font-display text-xl font-bold sm:text-2xl">{sekolah.nama}</h2>
          <p className="text-xs text-muted-foreground">
            {sekolah.alamat} · NPSN {sekolah.npsn}
          </p>
        </header>

        <h3 className="mt-6 text-center font-display text-base font-bold uppercase tracking-wide">
          Laporan Hasil Belajar Peserta Didik
        </h3>

        <dl className="mt-5 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          {[
            ["Nama Peserta Didik", s.nama],
            ["Kelas", k.nama],
            ["NIS / NISN", `${s.nis} / ${s.nisn}`],
            ["Program Keahlian", k.jurusan],
            ["Semester", "Ganjil"],
            ["Tahun Pelajaran", "2025/2026"],
          ].map(([label, isi]) => (
            <div key={label} className="grid grid-cols-[9rem_auto] gap-2">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="min-w-0 font-medium">: {isi}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[560px] border border-border text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="border border-border px-3 py-2 text-left">No</th>
                <th className="border border-border px-3 py-2 text-left">Mata Pelajaran</th>
                <th className="border border-border px-3 py-2">KKM</th>
                <th className="border border-border px-3 py-2">Nilai</th>
                <th className="border border-border px-3 py-2">Predikat</th>
                <th className="border border-border px-3 py-2 text-left">Capaian Kompetensi</th>
              </tr>
            </thead>
            <tbody>
              {baris.map((b, i) => {
                const pr = predikat(b.na);
                return (
                  <tr key={b.mid}>
                    <td className="border border-border px-3 py-2">{i + 1}</td>
                    <td className="border border-border px-3 py-2">
                      <span className="font-medium">{namaMapel(b.mid)}</span>
                      <span className="ml-1 text-xs text-muted-foreground">({kodeMapel(b.mid)})</span>
                    </td>
                    <td className="border border-border px-3 py-2 text-center">{b.kkm}</td>
                    <td className="border border-border px-3 py-2 text-center font-bold">{b.na || "-"}</td>
                    <td className="border border-border px-3 py-2 text-center">{pr.huruf}</td>
                    <td className="border border-border px-3 py-2 text-xs">
                      {b.na === 0
                        ? "Nilai belum lengkap."
                        : b.na >= b.kkm
                          ? `Menunjukkan penguasaan ${pr.label.toLowerCase()} pada seluruh kompetensi dasar.`
                          : "Perlu pendampingan dan remedial pada beberapa kompetensi dasar."}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-secondary/60 font-semibold">
                <td className="border border-border px-3 py-2" colSpan={3}>
                  Rata-rata Nilai
                </td>
                <td className="border border-border px-3 py-2 text-center">{rata}</td>
                <td className="border border-border px-3 py-2 text-center">{p.huruf}</td>
                <td className="border border-border px-3 py-2 text-xs">{p.label}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ketidakhadiran</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li className="flex justify-between"><span>Sakit</span><span>1 hari</span></li>
              <li className="flex justify-between"><span>Izin</span><span>0 hari</span></li>
              <li className="flex justify-between"><span>Tanpa Keterangan</span><span>0 hari</span></li>
            </ul>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Catatan Wali Kelas</p>
            <p className="mt-2 text-sm leading-relaxed">
              {rata >= 85
                ? "Ananda menunjukkan prestasi yang sangat baik. Pertahankan semangat belajar dan akhlak mulia."
                : rata >= 75
                  ? "Ananda belajar dengan baik. Tingkatkan ketekunan pada mata pelajaran yang masih di bawah KKM."
                  : "Ananda perlu meningkatkan kedisiplinan belajar dan mengikuti program remedial yang dijadwalkan."}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 text-center text-sm sm:grid-cols-3">
          <div>
            <p>Orang Tua/Wali</p>
            <div className="h-16" />
            <p className="font-medium">{s.wali}</p>
          </div>
          <div>
            <p>Paguyangan, 19 Desember 2025</p>
            <p>Wali Kelas</p>
            <div className="h-12" />
            <p className="font-medium underline">{namaGuru(k.waliId)}</p>
          </div>
          <div>
            <p>Kepala Sekolah</p>
            <div className="h-16" />
            <p className="font-medium underline">{sekolah.kepsek}</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
